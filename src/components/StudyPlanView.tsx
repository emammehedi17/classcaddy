import React from 'react';
import { LegacyPageFrame } from './LegacyPageFrame';

export const StudyPlanView: React.FC<{ headerHidden: boolean; active: boolean }> = ({ headerHidden, active }) => (
  <LegacyPageFrame src="/study-plan-content.html?cc-embedded=1" title="Class Caddy Study Plan" viewportMode hideHeaderOnScroll headerHidden active={active} />
);
