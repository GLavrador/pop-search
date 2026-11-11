import type { RobotEvent } from '../context/robotContext';
import type { Cue } from './cues';

/** What the app sounds like when something happens in it. Most things are silent. */
export const cueOf = (event: RobotEvent): Cue | null => {
  switch (event.kind) {
    case 'searchFound':
      return 'found';
    case 'searchEmpty':
      return 'empty';
    case 'analysisDone':
    case 'saved':
      return 'tada';
    case 'analysisDuplicate':
    case 'draftFound':
    case 'underReview':
    case 'copied':
      return 'notify';
    case 'searchFailed':
    case 'urlRejected':
    case 'analysisFailed':
    case 'saveFailed':
    case 'videoRemoveFailed':
    case 'serverDown':
    case 'addLocked':
    case 'binThreat':
      return 'error';
    case 'closeAttempt':
    case 'serverAwake':
    case 'signedIn':
      return 'ding';
    case 'reopened':
      return 'open';
    case 'videoRemoved':
    case 'iconTrashed':
      return 'trash';
    case 'appTrashed':
      return 'crash';
    default:
      return null;
  }
};
