/**
 * validateContract — FR-NC-004: minimal hand-written validator, no AJV.
 * Checks each required_field from the contract exists in output with correct typeof.
 * @param {object} output   - the component output object to validate
 * @param {object} contract - parsed contract JSON (must have required_fields array)
 * @returns {{ valid: boolean, errors: string[] }}
 */
export function validateContract(output, contract) {
  const errors = [];
  for (const field of contract.required_fields) {
    if (!(field.name in output)) {
      errors.push(`missing required field: ${field.name}`);
    } else if (typeof output[field.name] !== field.type) {
      errors.push(
        `field ${field.name}: expected type ${field.type}, got ${typeof output[field.name]}`
      );
    }
  }
  return { valid: errors.length === 0, errors };
}
