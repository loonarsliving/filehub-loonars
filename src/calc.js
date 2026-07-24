// Evaluator ekspresi aritmetika yang aman -- TANPA eval/Function, jadi tidak
// ada risiko eksekusi kode dari teks suara. Mendukung + - * / dan sisa bagi,
// pangkat (^), kurung, desimal, dan bilangan negatif. Dipakai kemampuan
// kalkulator lokal Ultron (skills.js), semuanya offline tanpa panggilan API.

const OPERATORS = {
  "+": { prec: 2, assoc: "L", fn: (a, b) => a + b },
  "-": { prec: 2, assoc: "L", fn: (a, b) => a - b },
  "*": { prec: 3, assoc: "L", fn: (a, b) => a * b },
  "/": { prec: 3, assoc: "L", fn: (a, b) => a / b },
  "%": { prec: 3, assoc: "L", fn: (a, b) => a % b },
  "^": { prec: 4, assoc: "R", fn: (a, b) => Math.pow(a, b) },
};

function tokenize(expr) {
  const tokens = [];
  let i = 0;
  while (i < expr.length) {
    const ch = expr[i];
    if (ch === " ") { i++; continue; }
    if (/[0-9.]/.test(ch)) {
      let num = "";
      while (i < expr.length && /[0-9.]/.test(expr[i])) num += expr[i++];
      tokens.push({ type: "num", value: parseFloat(num) });
      continue;
    }
    if (ch in OPERATORS || ch === "(" || ch === ")") {
      tokens.push({ type: "op", value: ch });
      i++;
      continue;
    }
    // Karakter tak dikenal -> ekspresi tidak valid.
    return null;
  }
  return tokens;
}

/** Evaluasi string ekspresi (mis. "500 + 30 * 2"). Number, atau null bila tak valid. */
export function evaluateExpression(expr) {
  const tokens = tokenize(expr);
  if (!tokens || !tokens.length) return null;

  // Shunting-yard: infix -> RPN, dengan penanganan unary minus.
  const output = [];
  const ops = [];
  let prevType = null; // "num" | "op" | "(" | ")"

  for (const tok of tokens) {
    if (tok.type === "num") {
      output.push(tok.value);
      prevType = "num";
    } else if (tok.value === "(") {
      ops.push("(");
      prevType = "(";
    } else if (tok.value === ")") {
      while (ops.length && ops[ops.length - 1] !== "(") output.push(ops.pop());
      if (!ops.length) return null; // kurung tidak seimbang
      ops.pop();
      prevType = ")";
    } else {
      let op = tok.value;
      // Minus/plus di posisi unary (awal, setelah operator atau "(").
      if ((op === "-" || op === "+") && (prevType === null || prevType === "op" || prevType === "(")) {
        if (op === "-") { ops.push("~"); prevType = "op"; continue; } // "~" = negasi unary
        prevType = "op"; continue; // unary plus: abaikan
      }
      const o1 = OPERATORS[op];
      while (ops.length) {
        const top = ops[ops.length - 1];
        if (top === "(") break;
        const o2 = top === "~" ? { prec: 5, assoc: "R" } : OPERATORS[top];
        if (o2.prec > o1.prec || (o2.prec === o1.prec && o1.assoc === "L")) output.push(ops.pop());
        else break;
      }
      ops.push(op);
      prevType = "op";
    }
  }
  while (ops.length) {
    const op = ops.pop();
    if (op === "(") return null;
    output.push(op);
  }

  // Evaluasi RPN.
  const stack = [];
  for (const tok of output) {
    if (typeof tok === "number") { stack.push(tok); continue; }
    if (tok === "~") { // negasi unary: pop satu operand
      const b = stack.pop();
      if (b === undefined) return null;
      stack.push(-b);
      continue;
    }
    const b = stack.pop();
    const a = stack.pop();
    if (a === undefined || b === undefined) return null;
    stack.push(OPERATORS[tok].fn(a, b));
  }
  if (stack.length !== 1 || Number.isNaN(stack[0]) || !Number.isFinite(stack[0])) return null;
  return stack[0];
}
