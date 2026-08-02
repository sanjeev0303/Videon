const inv = { amount_paid: 1000n, amount_due: null };
console.log(Number(inv.amount_paid ?? inv.amount_due ?? 0));
