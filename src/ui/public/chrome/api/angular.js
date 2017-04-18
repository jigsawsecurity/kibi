const _ = require('lodash');
import { format as formatUrl, parse as parseUrl } from 'url';

import Notifier from 'kibie/notify/notifier'; // kibi: import Kibi notifier
import kibiRemoveHashedParams from './kibi_remove_hashed_params'; // kibi: import util to clean the url
import kibiRemoveSirenSession from './kibi_remove_siren_session'; // kibi: import util to clean the sirenSession
import { UrlOverflowServiceProvider } from '../../error_url_overflow';

const URL_LIMIT_WARN_WITHIN = 1000;

module.exports = function (chrome, internals) {

  chrome.setupAngular = function () {
    const modules = require('ui/modules');
    const kibana = modules.get('kibana');

    _.forOwn(chrome.getInjected(), function (val, name) {
      kibana.value(name, val);
    });

    kibana
    .value('kbnVersion', internals.version)
    .value('kibiVersion', internals.kibiVersion) // kibi: added to manage kibi version
    .value('kibiEnterpriseEnabled', internals.kibiEnterpriseEnabled) // kibi:
    .value('kibiKibanaAnnouncement', internals.kibiKibanaAnnouncement) // kibi:
    .value('buildNum', internals.buildNum)
    .value('buildSha', internals.buildSha)
    .value('sessionId', Date.now())
    .value('esUrl', (function () {
      const a = document.createElement('a');
      a.href = chrome.addBasePath('/elasticsearch');
      return a.href;
    }()))
    .config(($httpProvider) => {
      // kibi: clean the hashed params from the URL if session storage empty
      const originalURL = window.location.href;
      let url = kibiRemoveHashedParams(originalURL, sessionStorage);
      url = kibiRemoveSirenSession(url, sessionStorage);
      if (originalURL !== url) {
        window.location.href = url;
      }
      // kibi:
      chrome.$setupXsrfRequestInterceptor($httpProvider);
    })
    .run(($location, $rootScope, Private) => {
      const notify = new Notifier();
      const urlOverflow = Private(UrlOverflowServiceProvider);
      const check = (event) => {
        if ($location.path() === '/error/url-overflow') return;

        try {
          if (urlOverflow.check($location.absUrl()) <= URL_LIMIT_WARN_WITHIN) {
            notify.directive({
              template: `
                <p>
                  The URL has gotten big and may cause Kibana
                  to stop working. Please either enable the
                  <code>state:storeInSessionStorage</code>
                  option in the <a href="#/management/kibana/settings">advanced
                  settings</a> or simplify the onscreen visuals.
                </p>
              `
            }, {
              type: 'error',
              actions: [{ text: 'close' }]
            });
          }
        } catch (e) {
          const { host, path, search, protocol } = parseUrl(window.location.href);
          // rewrite the entire url to force the browser to reload and
          // discard any potentially unstable state from before
          window.location.href = formatUrl({ host, pathname: path, search, protocol, hash: '#/error/url-overflow' });
        }
      };

      $rootScope.$on('$routeUpdate', check);
      $rootScope.$on('$routeChangeStart', check);
    });

    require('../directives')(chrome, internals);

    modules.link(kibana);
  };

};
