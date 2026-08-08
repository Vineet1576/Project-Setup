const isCharacterOnly = (e) => {
  let input = e;
  input = input.replace(/[^a-zA-Z\s'.]/g, "");
  input = input.replace(/^\s+/, "");
  return input;
};

const methodModel = {
  isCharacterOnly,
};

export default methodModel;
