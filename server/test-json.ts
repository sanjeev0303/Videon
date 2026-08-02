(BigInt.prototype as any).toJSON = function () {
  return Number(this);
};

const obj = {
  amount: 10n
};

try {
  console.log(JSON.stringify(obj));
} catch(err) {
  console.log('error', err);
}
