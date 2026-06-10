import { OAuthConfig, OAuthUserConfig } from '@auth/core/providers/oauth';
import { GitLabProfile } from 'next-auth/providers/gitlab';

export function GitLab<P extends GitLabProfile>(
  options: OAuthUserConfig<P> & { gitlabHost?: string },
): OAuthConfig<P> {
  const host = options.gitlabHost ?? 'https://gitlab.com';

  return {
    id: 'gitlab',
    name: 'GitLab',
    type: 'oauth',
    authorization: {
      url: `${host}/oauth/authorize`,
      params: { scope: 'read_user' },
    },
    token: `${host}/oauth/token`,
    userinfo: `${host}/api/v4/user`,
    checks: ['pkce', 'state'],
    profile(profile) {
      return {
        id: profile.id.toString(),
        name: profile.name ?? profile.username,
        email: profile.email,
        image: profile.avatar_url,
      };
    },
    style: { brandColor: '#FC6D26' },
    options,
  };
}
