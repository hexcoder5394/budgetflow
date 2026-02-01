import { doc, collection, getDocs, query, runTransaction } from "firebase/firestore";
import { db } from "../firebase";

const appId = 'default-503020-app';

/**
 * Checks all recurring items and auto-adds them to the budget if not yet processed for the current month.
 * Uses SEQUENTIAL processing to prevent database locking errors.
 */
export async function processRecurringBills(userId, currentMonthYear) { 
    if (!userId) return;

    const recurringPath = `artifacts/${appId}/users/${userId}/recurring_items`;
    const budgetPath = `artifacts/${appId}/users/${userId}/budget/${currentMonthYear}/items`;
    const accountsPath = `artifacts/${appId}/users/${userId}/bank_accounts`;

    try {
        // 1. Get all recurring subscriptions
        const q = query(collection(db, recurringPath));
        const snapshot = await getDocs(q);

        if (snapshot.empty) return;

        // 2. Loop through them ONE BY ONE (Sequential)
        // We use a simple 'for...of' loop instead of 'map' to ensure they don't fight over the same bank account
        for (const recDoc of snapshot.docs) {
            const item = recDoc.data();
            
            // CHECK: Has this item been processed for THIS month?
            if (item.lastProcessed === currentMonthYear) {
                continue; // Skip to next item
            }

            try {
                // 3. Run Transaction for this single item
                await runTransaction(db, async (transaction) => {
                    
                    // --- STEP A: READS (Must happen first) ---
                    let accountDoc = null;
                    const accountRef = item.accountId ? doc(db, accountsPath, item.accountId) : null;
                    
                    if (accountRef) {
                        accountDoc = await transaction.get(accountRef);
                        if (!accountDoc.exists()) {
                            throw new Error(`Bank Account ${item.accountId} not found`);
                        }
                    }

                    // --- STEP B: WRITES (Must happen after all reads) ---
                    
                    // 1. Deduct from Bank Account
                    if (accountDoc) {
                        const newBalance = accountDoc.data().balance - item.amount;
                        transaction.update(accountRef, { balance: newBalance });
                    }

                    // 2. Add to Budget Items
                    const newItemRef = doc(collection(db, budgetPath));
                    transaction.set(newItemRef, {
                        name: `[Auto] ${item.name}`,
                        amount: item.amount,
                        category: item.category,
                        date: `${currentMonthYear}-${String(item.dayOfMonth).padStart(2, '0')}`,
                        accountId: item.accountId || null,
                        isRecurring: true,
                        createdAt: new Date().toISOString()
                    });

                    // 3. Mark Subscription as "Processed"
                    const recRef = doc(db, recurringPath, recDoc.id);
                    transaction.update(recRef, { lastProcessed: currentMonthYear });
                });

                console.log(`✅ processed: ${item.name}`);

            } catch (err) {
                console.error(`Failed to process ${item.name}:`, err);
                // We continue the loop so one failure doesn't stop the others
            }
        }

    } catch (error) {
        console.error("Critical error in recurring bills engine:", error);
    }
}