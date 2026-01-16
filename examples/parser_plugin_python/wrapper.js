/**
 * Parser Plugin (Python/WASM) - JavaScript Wrapper
 * 
 * This module loads Pyodide (Python runtime in WASM) and exposes
 * a parse_excel function compatible with Register Manager.
 */

let pyodide = null;
let parserModule = null;

/**
 * Initialize Pyodide and load the parser module
 */
async function initPyodide() {
  if (pyodide) {
    return pyodide;
  }

  // Load Pyodide from CDN
  const { loadPyodide } = await import('https://cdn.jsdelivr.net/pyodide/v0.26.0/full/pyodide.mjs');

  pyodide = await loadPyodide({
    indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.26.0/full/'
  });

  // Install required packages
  await pyodide.loadPackage(['openpyxl', 'pandas']);

  // Load the parser module (from the same directory as this file)
  const parserCode = await fetch(new URL('./parser.py', import.meta.url)).then(r => r.text());
  await pyodide.runPythonAsync(parserCode);

  // Get reference to the parse_excel_json function
  parserModule = pyodide.globals.get('parse_excel_json');

  return pyodide;
}

/**
 * Parse Excel file bytes and return register data
 * 
 * @param {Uint8Array} fileBytes - Excel file content as Uint8Array
 * @returns {Promise<Object>} Parsed register data
 */
export async function parse_excel(fileBytes) {
  // Ensure Pyodide is initialized
  await initPyodide();

  try {
    // Convert Uint8Array to Python bytes
    const pyBytes = pyodide.toPy(fileBytes);

    // Call the Python parser
    const resultJson = parserModule(pyBytes);

    // Parse JSON result
    const result = JSON.parse(resultJson);

    return result;
  } catch (error) {
    console.error('Python parser error:', error);
    throw new Error(`Failed to parse Excel: ${error.message}`);
  }
}

/**
 * Initialize the WASM module (for compatibility with Register Manager)
 * This is called automatically when the module is loaded
 * 
 * @returns {Promise<Object>} Module exports
 */
export default async function init() {
  await initPyodide();
  return {
    parse_excel
  };
}

// Auto-initialize on import
let initPromise = null;

/**
 * Ensure Pyodide is initialized
 * 
 * @returns {Promise<Object>} Pyodide instance
 */
export function ensureInit() {
  if (!initPromise) {
    initPromise = initPyodide();
  }
  return initPromise;
}
