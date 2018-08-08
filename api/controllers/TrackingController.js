module.exports = {
    track: async function(req, res){
        // sails.log(req.body);

        const  { label_id, partner_id, status_id, action_time, reason_code, reason, weight, fee, pick_money }  = req.body;
        const newData  = JSON.stringify({partner_id, status_id, action_time, reason_code, reason, weight, fee, pick_money})

        const tracking = await Tracking.findOne({ 'label_id': label_id }).catch(error => sails.log(error));
        if(!tracking) {
            const newTracking = await Tracking.create({ label_id,  data: newData }).fetch()
            if(!newTracking) newTracking = {};
            // console.log(newTracking);

            res.ok();
        }
        if(tracking) {

            const updatedTracking = await Tracking.update( {label_id}, {data: tracking.data + ";" + newData }).fetch();
            if(!updatedTracking) console.log('failed to update');
            // console.log(updatedTracking);
            
            res.ok();
        }
    },

    getOrder: async (req, res) => {

        let trackings = await Tracking.find({}).catch(e => console.log('error: ' + e));
        if(!trackings) trackings = [];
        
        trackings.forEach((tracking, index) => {
            // console.log(tracking);
            const arrData = tracking.data.split(';');  //mảng các string
            // console.log(arrData);
            const arr = [];
            arrData.forEach(a => {  
                let dataJson = JSON.parse(a);
                dataJson['action_time'] = convert_time.fn(dataJson['action_time']);
                arr.push(dataJson);   
                // console.log(JSON.parse(a));
            })
            tracking['arrJson'] = arr;

            if(tracking.handling){
                const arrHandling = tracking.handling.split(';;');
                tracking['arrHandling'] = arrHandling;
            }
            
        });
        const me = req.me;

        return res.view('admin/index', { trackings, me, status: ghtk_status_id.STATUS_ID, code: ghtk_status_id.REASON_CODE })
    },
    handling: async function(req, res){
        // const nameUser = req.me.fullName;
        const me = req.me;
        const { message, label_id } = req.body;
        const tracking = await Tracking.findOne({ "label_id" : label_id }).catch(error => sails.log(error));
        if(!tracking) tracking = {};
        
    
        const newTracking = await Tracking.updateOne({ "label_id" : label_id }, { handling: tracking.handling? tracking.handling + ";;" + message +`[${me.fullName}]` : "" + message +`[${me.fullName}]`});
        if(!newTracking) console.log('cannot update tracking');
    
        return res.redirect('/admin');
      }
    
}