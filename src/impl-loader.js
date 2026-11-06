import fileUtil from "./file-util.js";
import VM from "./vm.js";

let loaded = false;

async function loadImpl(stepRegistry) {
  if (loaded) {
    return;
  }
  stepRegistry.clear();
  const vm = new VM();
  for (const filePath of fileUtil.getListOfFiles()) {
    process.env.GAUGE_STEPFILEPATH = filePath;
    vm.contextify(filePath, process.env.GAUGE_PROJECT_ROOT);
    await vm.runFile(filePath);
  }
  loaded = true;
}

export default {
  load: loadImpl
};
