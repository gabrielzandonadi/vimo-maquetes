import { Config } from '@remotion/cli/config';
// sem download de Chrome no ambiente: CHROME=/caminho/headless_shell npx remotion render …
if (process.env.CHROME) Config.setBrowserExecutable(process.env.CHROME);
Config.setVideoImageFormat('jpeg');
Config.setChromiumOpenGlRenderer('swangle');
