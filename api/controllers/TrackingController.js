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
                arr.push(JSON.parse(a));   
                // console.log(JSON.parse(a));
            })
            tracking['arrJson'] = arr;

            if(tracking.handling){
                const arrHandling = tracking.handling.split(';;');
                tracking['arrHandling'] = arrHandling;
            }
            
        });
      
        // console.log(trackings[0])
        return res.view('admin/index', { trackings })
    },
    handling: async function(req, res){
        const { message, label_id } = req.body;
        const tracking = await Tracking.findOne({ "label_id" : label_id }).catch(error => sails.log(error));
        if(!tracking) tracking = {};
        
    
        const newTracking = await Tracking.updateOne({ "label_id" : label_id }, { handling: tracking.handling? tracking.handling + ";;" + message : "" + message });
        if(!newTracking) console.log('cannot update tracking');
    
        return res.redirect('/admin');
      }
    
}