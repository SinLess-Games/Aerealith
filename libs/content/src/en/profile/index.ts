import type { ProfileScaffoldContent } from '../../types';

import { profileConnectionCategories } from './connection-categories';
import { profileTabs } from './profile-tabs';
import { profileSidebar } from './sidebar';

export * from './connection-categories';
export * from './profile-edit-options';
export * from './profile-tabs';
export * from './sidebar';

export const profileScaffoldContent = {
  tabs: profileTabs,
  sidebar: profileSidebar,
  connectionCategories: profileConnectionCategories,
} as const satisfies ProfileScaffoldContent;
