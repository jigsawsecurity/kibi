/*eslint max-len: 0*/
import requirefrom from 'requirefrom';

const packageJson = requirefrom('src/utils')('package_json');

/**
 * Defines the following objects:
 *
 * - a configuration with valid Company dashboard and invalid ArticlesId dashboard set in kibi:defaultDashboardId
 */
module.exports = [
  {
    index: {
      _index: '.kibi',
      _type: 'config',
      _id: packageJson.kibi_version
    }
  },
  {
    buildNum: packageJson.build.number,
    'kibi:defaultDashboardId': 'ArticlesId'
  },
  {
    index: {
      _index: '.kibi',
      _type: 'dashboard',
      _id: 'CompanyId',
    }
  },
  {
    title: 'Company'
  }
];
