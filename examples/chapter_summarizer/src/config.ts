import { config as baseConfig } from '@buildownai/examples_config'

export const config = () => ({
  ...baseConfig(),
  inputDir: "./content/input",
  outputDir: "./content/output",
});
