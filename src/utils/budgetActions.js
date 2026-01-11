import { doc, collection, addDoc, runTransaction, deleteDoc } from "firebase/firestore";
import { db } from "../firebase";

const appId = 'default-503020-app';
const getUserPath = (uid) => `artifacts/${appId}/users/${uid}`;

export async function addBudgetItem(userId, monthYear, itemData, category) {
    const budgetPath = `${getUserPath(userId)}/budget/${monthYear}/items`;
    const accountsPath = `${getUserPath(userId)}/bank_accounts`;
    const { name, amount, date, accountId, toAccountId } = itemData;
    const numAmount = parseFloat(amount);

    try {
        await runTransaction(db, async (transaction) => {
            // --- STEP 1: READS (Must be done first!) ---
            let accountDoc = null;
            let toAccountDoc = null;
            
            // Prepare references
            const accountRef = accountId ? doc(db, accountsPath, accountId) : null;
            const toAccountRef = toAccountId ? doc(db, accountsPath, toAccountId) : null;

            // Read "From" Account
            if (accountRef) {
                accountDoc = await transaction.get(accountRef);
                if (!accountDoc.exists()) throw new Error("From Account not found");
            }

            // Read "To" Account (for transfers)
            if (toAccountRef) {
                toAccountDoc = await transaction.get(toAccountRef);
                if (!toAccountDoc.exists()) throw new Error("To Account not found");
            }

            // --- STEP 2: WRITES (Done after all reads) ---
            
            // 1. Deduct from "From" Account
            if (accountDoc) {
                const newBalance = accountDoc.data().balance - numAmount;
                transaction.update(accountRef, { balance: newBalance });
            }

            // 2. Add to "To" Account
            if (toAccountDoc) {
                const newToBalance = toAccountDoc.data().balance + numAmount;
                transaction.update(toAccountRef, { balance: newToBalance });
            }
        });

        // 3. Add Item to Budget List (Safe to do after transaction)
        await addDoc(collection(db, budgetPath), {
            name,
            amount: numAmount,
            category,
            date,
            accountId,
            toAccountId: toAccountId || null,
            createdAt: new Date().toISOString()
        });

    } catch (error) {
        console.error("Transaction failed: ", error);
        throw error;
    }
}

export async function deleteBudgetItem(userId, monthYear, item) {
    const itemPath = `${getUserPath(userId)}/budget/${monthYear}/items/${item.id}`;
    const accountsPath = `${getUserPath(userId)}/bank_accounts`;

    try {
        await runTransaction(db, async (transaction) => {
            // --- STEP 1: READS ---
            let accountDoc = null;
            let toAccountDoc = null;
            
            const accountRef = item.accountId ? doc(db, accountsPath, item.accountId) : null;
            const toAccountRef = item.toAccountId ? doc(db, accountsPath, item.toAccountId) : null;

            if (accountRef) {
                accountDoc = await transaction.get(accountRef);
            }
            if (toAccountRef) {
                toAccountDoc = await transaction.get(toAccountRef);
            }

            // --- STEP 2: WRITES ---
            
            // 1. Refund "From" Account
            if (accountDoc && accountDoc.exists()) {
                const newBalance = accountDoc.data().balance + item.amount;
                transaction.update(accountRef, { balance: newBalance });
            }

            // 2. Charge back "To" Account
            if (toAccountDoc && toAccountDoc.exists()) {
                const newBalance = toAccountDoc.data().balance - item.amount;
                transaction.update(toAccountRef, { balance: newBalance });
            }

            // 3. Delete the Item
            const itemRef = doc(db, itemPath);
            transaction.delete(itemRef);
        });
    } catch (error) {
        console.error("Delete failed: ", error);
        throw error;
    }
}