import Cell from "./Cell"
import SheetMemory from "./SheetMemory"
import { ErrorMessages } from "./GlobalDefinitions";



export class FormulaEvaluator {
  // Define a function called update that takes a string parameter and returns a number
  private _errorOccured: boolean = false;
  private _errorMessage: string = "";
  private _currentFormula: FormulaType = [];
  private _lastResult: number = 0;
  private _sheetMemory: SheetMemory;
  private _result: number = 0;


  constructor(memory: SheetMemory) {
    this._sheetMemory = memory;
  }
  

  /**
    * place holder for the evaluator.   I am not sure what the type of the formula is yet 
    * I do know that there will be a list of tokens so i will return the length of the array
    * 
    * I also need to test the error display in the front end so i will set the error message to
    * the error messages found In GlobalDefinitions.ts
    * 
    * according to this formula.
    * 
    7 tokens partial: "#ERR",
    8 tokens divideByZero: "#DIV/0!",
    9 tokens invalidCell: "#REF!",
  10 tokens invalidFormula: "#ERR",
  11 tokens invalidNumber: "#ERR",
  12 tokens invalidOperator: "#ERR",
  13 missingParentheses: "#ERR",
  0 tokens emptyFormula: "#EMPTY!",

                    When i get back from my quest to save the world from the evil thing i will fix.
                      (if you are in a hurry you can fix it yourself)
                               Sincerely 
                               Bilbo
    * 
   */

  // helper function to get the precedence of an operator
  private getOperatorPrecedence(operator: string): number | null {
    switch (operator) {
      case "+":
      case "-":
        return 1;
      case "*":
      case "/":
        return 2;
      default:
        return null;
    }
  }

// Defining the evaluate function
evaluate(formula: FormulaType) {

  // clear the error message
  this._errorMessage = ErrorMessages.emptyFormula;
  this._result = 0;
  if (formula.length === 0) {return;}

  // create 2 stacks, one for storing numbers and one for storing operators
  this._errorMessage = "";
  const numStack: number[] = []; 
  const opStack: string[] = []; 

  // return "ERR" if the formula is empty
  if (formula.length === 2 && this.isNumber(formula[0]) && this.isOperator(formula[1])) {
    this._errorOccured = true;
    this._errorMessage = ErrorMessages.invalidFormula;
    this._result = Number(formula[0]);
    return;
  }else if (formula.length === 2 && this.isNumber(formula[0]) && formula[1] === "(") {
    this._errorOccured = true;
    this._errorMessage = ErrorMessages.invalidFormula;
    this._result = Number(formula[0]); 
    return;
  }else if (formula.length % 2 === 0 && this.isOperator(formula[formula.length - 1])) {
    formula.pop(); 
    this._errorMessage = ErrorMessages.invalidFormula;
  }else if (formula.length > 2 && this.isOperator(formula[formula.length - 1])) {
    this._errorOccured = true;
    this._errorMessage = ErrorMessages.invalidFormula;
    this._result = Number(formula[0]);
    return;}
  


  // iterate through the formula from left to right
  for (const token of formula) {
    // push the token to the number stack if it is a number
    if (this.isNumber(token)) {
      numStack.push(Number(token));
    }
    // if the token is a cell reference, get the cell value and push it to the number stack
    else if (this.isCellReference(token)) {
      const [value, error] = this.getCellValue(token);
      if (error === "") {
        numStack.push(value);
      } else {
  
        this._errorOccured = true;
        this._errorMessage = error;
        this._result = 0;
        return;
      }
    }
    
    else if (token === "(") {
      opStack.push(token);
    }
    // if the token is a right parenthesis, pop the operator stack until the left parenthesis is found
    else if (token === ")") {
      while (opStack.length > 0 && opStack[opStack.length - 1] !== "(") {
        this.applyOperator(numStack, opStack);
      }
      if (opStack.length > 0 && opStack[opStack.length - 1] === "(") {
        opStack.pop(); 
      } else {
        // if the left parenthesis is not found, set the error message and return
        this._errorOccured = true;
        this._errorMessage = ErrorMessages.missingParentheses;
        this._result = 0;
        return;
      }
    }
    // if the token is an operator and the operator stack is empty, push the token to the operator stack
    else if (this.isOperator(token)) {
      while (
        opStack.length > 0 &&
    (this.getOperatorPrecedence(opStack[opStack.length - 1]) ?? 0) >=
    (this.getOperatorPrecedence(token) ?? 0)
      ) {
        this.applyOperator(numStack, opStack); 
      }
      opStack.push(token);
    }
  }

  // after iterating through the formula, pop the remaining operators from the operator stack and apply them to the number stack
  while (opStack.length > 0) {
    if (opStack[opStack.length - 1] === "(" || opStack[opStack.length - 1] === ")") {
      // if the operator stack contains a parenthesis, set the error message and return
      this._errorOccured = true;
      this._errorMessage = ErrorMessages.missingParentheses;
      this._result = 0;
      return;
    }
    this.applyOperator(numStack, opStack);
  }

  // if the number stack contains only one number, set the result to that number
  if (numStack.length === 1) {
    this._result = numStack.pop() || 0;
  } else {
    // if the number stack contains more than one number, set the error message and return
    this._errorOccured = true;
    this._errorMessage = ErrorMessages.invalidFormula;
    this._result = 0;
  }
}

// helper function determine if a token is an operator
private isOperator(token: string): boolean {
  return token === "+" || token === "-" || token === "*" || token === "/";
}

// helper function to apply an operator to the number stack
private applyOperator(numStack: number[], opStack: string[]): void {
  const operator = opStack.pop(); 
  if (operator) {
    const right = numStack.pop() || 0; 
    const left = numStack.pop() || 0;
    switch (operator) {
      case "+":
        numStack.push(left + right);
        break;
      case "-":
        numStack.push(left - right);
        break;
      case "*":
        numStack.push(left * right);
        break;
      case "/":
        if (right === 0) {
        
          this._errorOccured = true;
          this._errorMessage = ErrorMessages.divideByZero;
          numStack.push(Infinity);
        } else {
          numStack.push(left / right);
        }
        break;
    }
  }
  
}
  
  public get error(): string {
    return this._errorMessage
  }

  public get result(): number {
    return this._result;
  }




  /**
   * 
   * @param token 
   * @returns true if the toke can be parsed to a number
   */
  isNumber(token: TokenType): boolean {
    return !isNaN(Number(token));
  }

  /**
   * 
   * @param token
   * @returns true if the token is a cell reference
   * 
   */
  isCellReference(token: TokenType): boolean {

    return Cell.isValidCellLabel(token);
  }

  /**
   * 
   * @param token
   * @returns [value, ""] if the cell formula is not empty and has no error
   * @returns [0, error] if the cell has an error
   * @returns [0, ErrorMessages.invalidCell] if the cell formula is empty
   * 
   */
  getCellValue(token: TokenType): [number, string] {

    let cell = this._sheetMemory.getCellByLabel(token);
    let formula = cell.getFormula();
    let error = cell.getError();

    // if the cell has an error return 0
    if (error !== "" && error !== ErrorMessages.emptyFormula) {
      return [0, error];
    }

    // if the cell formula is empty return 0
    if (formula.length === 0) {
      return [0, ErrorMessages.invalidCell];
    }


    let value = cell.getValue();
    return [value, ""];

  }


}

export default FormulaEvaluator;