import { Meteor } from 'meteor/meteor';

import { CompetitionTypes } from './logic/competition_type.js';

Meteor.startup(() => {
  // code to run on server at startup

    console.log(CompetitionTypes[0].getSports());
});