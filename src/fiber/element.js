let A1 = { key: "A1" };
let B1 = { key: "B1" };
let B2 = { key: "B2" };
let C1 = { key: "C1" };
let C2 = { key: "C2" };
A1.child = B1;
B1.sibling = B2;
B1.return = A1;
B2.return = A1;
B1.child = C1;
C1.sibling = C2;
C1.return = B1;
C2.return = B1;

module.exports = A1;
