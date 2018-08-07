module.exports = {
    track: async function(req, res){
        // sails.log(req.body);

        const  { label_id, partner_id, status_id, action_time, reason_code, reason, weight, fee, pick_money }  = req.body;
        const newData  = JSON.stringify({partner_id, status_id, action_time, reason_code, reason, weight, fee, pick_money})

        const tracking = await Tracking.findOne({ 'label_id': label_id }).catch(error => sails.log(error));
        if(!tracking) {
            const newTracking = await Tracking.create({ label_id,  data: newData }).fetch()
            if(!newTracking) console.log('cannot create tracking')
            // console.log(newTracking);

            res.ok();
        }
        if(tracking) {

            const updatedTracking = await Tracking.update( {label_id}, {data: tracking.data + ";" + newData }).fetch();
            if(!updatedTracking) console.log('failed to update');
            // console.log(updatedTracking);
            
            res.ok();
        }

        // data.array.forEach(element => {
            
        // });

        // const data = JSON.stringify(req.body);
        // await Order.create({ data }).fetch();
        // return res.send(req.body);
    },
    getOrder: async (req, res) => {
        const trackings = await Tracking.find({});
        if(!trackings) return sails.log('Cannot find orders');

        
        
        trackings.forEach((tracking, index) => {
            // console.log(tracking);
            const arrData = tracking.data.split(';');
            // console.log(arrData);
            const arr = [];
            arrData.forEach(a => {  //mảng các string
                arr.push(JSON.parse(a));   
                // console.log(JSON.parse(a));
                
            })
            tracking['arrJson'] = arr;
        });
        
        console.log(trackings[0]);
        

        return res.view('admin/index', { trackings })
    }
}