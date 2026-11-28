import { useMemo } from 'react';

import type { GameMode } from '../game/mode';

import { rulebook } from './rulebook';
import { TextPage } from './TextPage';

/** The rulebook text for a match's rules. The Rules route wraps it in a screen. */
export function RulesBody({
  mode,
}: {
  /** Rules of the current match; the text quotes its numbers. */
  mode: Readonly<GameMode>;
}) {
  const sections = useMemo(() => rulebook(mode), [mode]);
  return <TextPage sections={sections} />;
}
