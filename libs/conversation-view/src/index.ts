import './scss/styles.scss';

export {
  AdvancedViewProvider,
  useAdvancedView,
} from './context/AdvancedViewContext';

export { OnboardingProvider } from './context/OnboardingContext';
export * from './models/actions';
export * from './models/titles';
export * from './models/attachments-styles';
export * from './models/structure-component';
export * from './models/message';
export * from './types/charting-icon';
export { ConversationWelcome } from './components/ConversationWelcome/ConversationWelcome';
export { AdvancedView } from './components/AdvancedView/AdvancedView';
export { ConversationView } from './components/ConversationView/ConversationView';
// eslint-disable-next-line @nx/enforce-module-boundaries
export type { ShareConversationProps } from '../../share-conversation/src/models/share-conversation';

// eslint-disable-next-line @nx/enforce-module-boundaries
export type { UserInfo } from '../../user-info/src/models/user-info';
