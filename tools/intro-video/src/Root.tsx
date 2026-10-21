import React from 'react';
import { Composition } from 'remotion';
import '@fontsource/koho/500.css';
import '@fontsource/koho/700.css';
import '@fontsource/arsenal/400.css';
import '@fontsource/jetbrains-mono/500.css';
import { Institucional, DURATION } from './Institucional';

export const Root: React.FC = () => (
  <>
    <Composition id="HomeroH" component={Institucional} durationInFrames={DURATION} fps={30} width={1920} height={1080} />
    <Composition id="HomeroV" component={Institucional} durationInFrames={DURATION} fps={30} width={1080} height={1920} />
  </>
);
