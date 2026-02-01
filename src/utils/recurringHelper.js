import { doc, collection, getDocs, query, runTransaction } from "firebase/firestore";
import { db } from "../firebase";

const appId = 'default-503020-app';

export async function processRecurringBills(userId, currentMonthYear) { 
    if (!userId) return;

    const recurringPath = `artifacts/${appId}/users/${userId}/recurring_items`;
    const accountsPath = `artifacts/${appId}/users/${userId}/bank_accounts`;
    
    // NOTE: This logic handles the "Destination" month for the bill
    // e.g., if a bill is due on the 29th, it might fall into February
    
    try {
        const q = query(collection(db, recurringPath));
        const snapshot = await getDocs(q);

        if (snapshot.empty) return;

        for (const recDoc of snapshot.docs) {
            const item = recDoc.data();
            
            // Determine the target month for this bill
            // Usually it's the current month, but you might want logic here 
            // to handle "Next Month" bills if you are near the end of the month.
            // For now, we use the passed 'currentMonthYear' (e.g., "2026-02")
            const targetMonth = currentMonthYear; 

            // CHECK: Has this item been processed for THIS target month?
            if (item.lastProcessed === targetMonth) {
                continue; 
            }

            const budgetDocPath = `artifacts/${appId}/users/${userId}/budget/${targetMonth}`;
            const budgetItemsPath = `${budgetDocPath}/items`;

            try {
                await runTransaction(db, async (transaction) => {
                    
                    // --- STEP A: READS ---
                    
                    // 1. Read Bank Account
                    let accountDoc = null;
                    const accountRef = item.accountId ? doc(db, accountsPath, item.accountId) : null;
                    if (accountRef) {
                        accountDoc = await transaction.get(accountRef);
                        if (!accountDoc.exists()) throw new Error(`Bank Account ${item.accountId} not found`);
                    }

                    // 2. Read Budget Month Document (Crucial Fix!)
                    const budgetDocRef = doc(db, budgetDocPath);
                    const budgetDocSnap = await transaction.get(budgetDocRef);

                    // --- STEP B: WRITES ---

                    // 1. Ensure Budget Month Exists (The Fix for your Error)
                    if (!budgetDocSnap.exists()) {
                        transaction.set(budgetDocRef, {
                            income: 0,
                            limit: 0,
                            createdAt: new Date().toISOString()
                        });
                    }

                    // 2. Deduct from Bank
                    if (accountDoc) {
                        const newBalance = accountDoc.data().balance - item.amount;
                        transaction.update(accountRef, { balance: newBalance });
                    }

                    // 3. Add Budget Item
                    const newItemRef = doc(collection(db, budgetItemsPath));
                    transaction.set(newItemRef, {
                        name: `[Auto] ${item.name}`,
                        amount: item.amount,
                        category: item.category,
                        date: `${targetMonth}-${String(item.dayOfMonth).padStart(2, '0')}`,
                        accountId: item.accountId || null,
                        isRecurring: true,
                        createdAt: new Date().toISOString()
                    });

                    // 4. Mark Subscription as Processed
                    const recRef = doc(db, recurringPath, recDoc.id);
                    transaction.update(recRef, { lastProcessed: targetMonth });
                });

                console.log(`✅ Processed: ${item.name} for ${targetMonth}`);

            } catch (err) {
                console.error(`Failed to process ${item.name}:`, err);
            }
        }

    } catch (error) {
        console.error("Critical error in recurring bills engine:", error);
    }
}