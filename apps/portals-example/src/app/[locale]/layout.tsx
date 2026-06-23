import {
  AdvancedViewProvider,
  OnboardingProvider,
  ChatMessagesProvider,
  ConversationViewFeatureTogglesProvider,
  CrossDatasetAttachmentsProvider,
} from '@epam/statgpt-conversation-view';
import ConversationListWrapper from '../../components/ConversationList/ConversationListWrapper';
import { ConversationListProvider } from '../../context/ConversationListContext';
import { I18nProvider } from '../../locales/client';
import { getUserToken } from '../../utils/auth/auth-request';
import { getIsEnableAuthToggle } from '../../utils/auth/get-auth-toggle';
import { getIsInvalidSession } from '../../utils/auth/is-valid-session';
import { cookies, headers } from 'next/headers';
import { ReactNode } from 'react';
import { getDeploymentConfiguration } from '../actions/configuration';
import { DeploymentConfigProvider } from '../../context/DeploymentConfigProvider';
import { conversationApi, dialApiClient } from '../api/api';
import { DIAL_API_ROUTES } from '@epam/statgpt-dial-toolkit';
import { NoAccessView } from '../../components/NoAccessView';
import { ComponentsConfig } from '../../components/configs/ComponentsConfig/ComponentsConfig';
import { TextsConfig } from '../../components/configs/TextsConfig/TextsConfig';
import { ClientProvidersWrapper } from '../../components/ClientProvidersWrapper/ClientProvidersWrapper';
import { getDatasetsMetadata } from '../actions/datasets-metadata';
import {
  buildDatasetDimensionsMetadataMap,
  buildDatasetLastUpdatedMap,
} from '@epam/statgpt-sdmx-toolkit';
import { parseBoolean } from '@epam/statgpt-shared-toolkit';

export default async function LocaleLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const isEnableAuth = getIsEnableAuthToggle();
  const token = await getUserToken(isEnableAuth, headers(), cookies());
  const isInvalidSession = await getIsInvalidSession(isEnableAuth, token);

  if (isInvalidSession) {
    return (
      <I18nProvider locale={locale}>
        <div className="main-layout flex size-full flex-row">{children}</div>
      </I18nProvider>
    );
  }

  const configuration = await getDeploymentConfiguration();
  let isAnyConversationAvailable = false;

  if (!configuration.success) {
    try {
      const bucket = await dialApiClient.getRequest<{ bucket: string }>(
        DIAL_API_ROUTES.BUCKET,
        token?.access_token as string,
      );

      const conversations = await conversationApi.getConversations(
        token?.access_token as string,
        bucket.bucket,
        locale,
      );

      isAnyConversationAvailable = conversations.length > 0;
    } catch (error) {
      console.error('Error fetching conversations:', error);
    }
  }

  const clientContactSupportUrl = process.env.CLIENT_CONTACT_SUPPORT_URL;
  const isCrossDatasetModeOn = parseBoolean(process.env.CROSS_DATASET_MODE);
  const isMetadataInSidePanel = isCrossDatasetModeOn;
  const isTableSettingsFeatureEnabled = isCrossDatasetModeOn;

  const metadata = await getDatasetsMetadata();
  const datasetDimensionsMetadataMap = metadata.data
    ? buildDatasetDimensionsMetadataMap(metadata.data)
    : {};
  const datasetLastUpdatedMap = metadata.data
    ? buildDatasetLastUpdatedMap(metadata.data)
    : {};

  const getContent = () => {
    if (!configuration.success && !isAnyConversationAvailable) {
      return <NoAccessView clientContactSupportUrl={clientContactSupportUrl} />;
    }

    return (
      <DeploymentConfigProvider config={configuration.data}>
        <ConversationViewFeatureTogglesProvider
          isMetadataInSidePanel={isMetadataInSidePanel}
          isCrossDatasetModeOn={isCrossDatasetModeOn}
          isTableSettingsFeatureEnabled={isTableSettingsFeatureEnabled}
        >
          <ClientProvidersWrapper
            isAgentAvailable={configuration.success}
            datasetDimensionsMetadataMap={datasetDimensionsMetadataMap}
            datasetLastUpdatedMap={datasetLastUpdatedMap}
          >
            <OnboardingProvider>
              <AdvancedViewProvider>
                <CrossDatasetAttachmentsProvider>
                  <ConversationListProvider>
                    <ChatMessagesProvider>
                      <ConversationListWrapper
                        clientContactSupportUrl={clientContactSupportUrl}
                      />
                      <main className="h-full min-w-0 flex-1">{children}</main>
                    </ChatMessagesProvider>
                  </ConversationListProvider>
                </CrossDatasetAttachmentsProvider>
              </AdvancedViewProvider>
            </OnboardingProvider>
          </ClientProvidersWrapper>
        </ConversationViewFeatureTogglesProvider>
      </DeploymentConfigProvider>
    );
  };

  const azureContentManagementPolicyUrl =
    process.env.CONTENT_MANAGEMENT_POLICY_URL;

  return (
    <I18nProvider locale={locale}>
      <div className="main-layout flex size-full flex-row">
        <ComponentsConfig>
          <TextsConfig
            clientContactSupportUrl={clientContactSupportUrl}
            azureContentManagementPolicyUrl={azureContentManagementPolicyUrl}
          >
            {getContent()}
          </TextsConfig>
        </ComponentsConfig>
      </div>
    </I18nProvider>
  );
}
