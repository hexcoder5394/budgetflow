import { doc, collection, addDoc, updateDoc, getDocs, query, where, runTransaction } from "firebase/firestore";
import { db } from "../firebase";

const appId = 'default-503020-app';

/**
 * Checks all recurring items and auto-adds them to the budget if not yet processed for the current month.
 */
export async function processRecurringBills(userId, currentMonthYear) { // e.g., "2026-02"
    if (!userId) return;

    const recurringPath = `artifacts/${appId}/users/${userId}/recurring_items`;
    const budgetPath = `artifacts/${appId}/users/${userId}/budget/${currentMonthYear}/items`;
    const accountsPath = `artifacts/${appId}/users/${userId}/bank_accounts`;

    try {
        // 1. Get all recurring subscriptions
        const q = query(collection(db, recurringPath));
        const snapshot = await getDocs(q);

        if (snapshot.empty) return;

        const promises = snapshot.docs.map(async (recDoc) => {
            const item = recDoc.data();
            
            // CHECK: Has this item been processed for THIS month?
            if (item.lastProcessed === currentMonthYear) {
                return; // Already done, skip.
            }

            // AUTO-ADD LOGIC
            await runTransaction(db, async (transaction) => {
                // 1. Deduct from Bank Account (if an account is selected)
                if (item.accountId) {
                    const accountRef = doc(db, accountsPath, item.accountId);
                    const accountDoc = await transaction.get(accountRef);
                    if (accountDoc.exists()) {
                        const newBalance = accountDoc.data().balance - item.amount;
                        transaction.update(accountRef, { balance: newBalance });
                    }
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

                // 3. Mark Subscription as "Processed" for this month
                const recRef = doc(db, recurringPath, recDoc.id);
                transaction.update(recRef, { lastProcessed: currentMonthYear });
            });
        });

        await Promise.all(promises);

    } catch (error) {
        console.error("Error processing recurring bills:", error);
    }
}