    /**
 * Tracking.js
 *
 * @description :: A model definition.  Represents a database table/collection/etc.
 * @docs        :: https://sailsjs.com/docs/concepts/models-and-orm/models
 */

module.exports = {

    attributes: {
      
        label_id :{type:'string'},
        data: { type: 'string'},

        // label_id: {type:'string'},
        
        // action_time: {type:'string'},
        // reason_code: {type:'string'},
        // reason: {type:'string'},
        // weight: {type:'number', columnType:'FLOAT'},
        // fee: {type:'number'},
        status_id: {type:'number'},
        handling: { type: 'string'},
        reason: { type: 'string'},
        isHandled: { type: 'boolean' }
    },
    
  };