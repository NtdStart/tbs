module.exports = {

    index: async function (req, res) {
        if(!req.isSocket) return res.badRequest()
        var socketId = sails.sockets.getId(req)

        
        sails.log('My socket ID is: ' + socketId)
        sails.sockets.join(req,'cskh', function(err) {
        if (err) {return res.serverError(err);}
        res.ok()
      });
    },

    GiaoHangTietKiemWebHooks: async function (req, res) {
        sails.log(req.body);

        let { label_id, partner_id, status_id, action_time, reason_code, reason, weight, fee, pick_money } = req.body;
        pick_money = convertTypeCurr.fn(pick_money);
        fee = convertTypeCurr.fn(fee);
        const newData = JSON.stringify({ partner_id, status_id, action_time, reason_code, reason, weight, fee, pick_money })

        const tracking = await Tracking.findOne({ 'label_id': label_id }).catch(error => sails.log(error));

        if (!tracking) {
            const newTracking = await Tracking.create({ label_id, data: newData, status_id, reason }).fetch()
            if (!newTracking) return res.send('cannot create tracking');
            const arrData = newTracking.data.split(';');  //mảng string các obj
            const arr = [];
            arrData.forEach(a => {
                let dataJson = JSON.parse(a);
                dataJson['action_time'] = convert_time.fn(dataJson['action_time']);
                arr.push(dataJson);
            })

            newTracking['arrJson'] = arr;
            newTracking.arrHandling = [];
            newTracking.status_id = status_id;

            
            for(let i = 0; i < ghtk_status_id.STATUS_ID.length; i++){ 
                if(ghtk_status_id.STATUS_ID[i].status_id == newTracking.arrJson[newTracking.arrJson.length - 1].status_id ){ 
                    newTracking.status_info = ghtk_status_id.STATUS_ID[i].description;
                } 
            }
            console.log(newTracking);

            let newDelayTracking;


            if(newTracking.status_id == "4" && newTracking.arrJson[0].reason != '' || newTracking.status_id == "9" || newTracking.status_id == "10" || newTracking.status_id == "49" ||newTracking.status_id == "410" ){
                newDelayTracking = newTracking;
                sails.sockets.broadcast('cskh','new-tracking', { newDelayTracking, newTracking, status: ghtk_status_id.STATUS_ID });
                
            }else{
                sails.sockets.broadcast('cskh','new-tracking', { newTracking, status: ghtk_status_id.STATUS_ID })
            } 
                   
            return res.ok();
        }

        if (tracking) {

            const updatedTracking = await Tracking.updateOne({ label_id }, { data: tracking.data + ";" + newData, reason });
            
            if (!updatedTracking) return res.send('failed to update');
            // console.log(updatedTracking)
            updatedTracking.status_id = status_id;
            const arrData = updatedTracking.data.split(';');  //mảng string các obj
            const arr = [];
            arrData.forEach(a => {
                let dataJson = JSON.parse(a);
                dataJson['action_time'] = convert_time.fn(dataJson['action_time']);
                arr.push(dataJson);
            })

            updatedTracking.reason = reason;
            updatedTracking['arrJson'] = arr;
            // updatedTracking['reason'] = updatedTracking['arrJson'][0].reason;
            if (updatedTracking.handling) {
                const arrHandling = updatedTracking.handling.split(';;');
                updatedTracking['arrHandling'] = arrHandling;
            }

            for(let i = 0; i < ghtk_status_id.STATUS_ID.length; i++){ 
                if(ghtk_status_id.STATUS_ID[i].status_id == updatedTracking.arrJson[updatedTracking.arrJson.length - 1].status_id ){ 
                    updatedTracking.status_info = ghtk_status_id.STATUS_ID[i].description;
                } 
            }
            console.log(updatedTracking);
            
            sails.sockets.broadcast('cskh','update-tracking', {updatedTracking, status: ghtk_status_id.STATUS_ID} );

            return res.ok();
        }
    },

    getAllTrackings: async (req, res) => {
        if (!req.me) {
            return res.redirect('/');
        }
        let trackings = await Tracking.find({})
        .sort('createdAt DESC')
        .catch(e => console.log('error: ' + e));
        if (!trackings) trackings = [];
        trackings = convert_to_array_json.convert(trackings);

        const me = req.me;
        // trackings = trackings.reverse();

        return res.view('admin/index', { trackings, me, status: ghtk_status_id.STATUS_ID, code: ghtk_status_id.REASON_CODE })
    },

    handling: async function (req, res) {
        // const nameUser = req.me.fullName;
        const me = req.me;
        
        
        const { messageSocket, message, label_id } = req.body;

        const tracking = await Tracking.findOne({ "label_id": label_id }).catch(error => sails.log(error));
        if (!tracking) tracking = {};

        const updatedTracking = await Tracking.updateOne({ "label_id": label_id }, { handling: tracking.handling ? tracking.handling + ";;" + messageSocket + `[${me.fullName}]` : "" + messageSocket + `[${me.fullName}]` });
        if (!updatedTracking) res.send('cannot update tracking');

        if (updatedTracking.handling) {
            const arrHandling = updatedTracking.handling.split(';;');
            updatedTracking['arrHandling'] = arrHandling;
        }

        sails.sockets.broadcast('cskh','server-send-Message', { updatedTracking } );
        return res.redirect("..");
    },

    getDelay: async function (req, res) {
        if (!req.me) {
            return res.redirect('/');
        }

        let trackings = await Tracking.find({
            where:
            {
                or:
                    [ {
                        
                           status_id: 4, 
                           reason: { '!=': ''} 
                        
                      },
                    { status_id: "9" },
                    { status_id: "10" },
                    { status_id: "49" },
                    { status_id: "410" }]
            }
        })
        .sort('updatedAt DESC')
        .catch(e => res.send('error: ' + e));


        if (!trackings) return trackings = [];

        trackings = convert_to_array_json.convert(trackings);
        
        const me = req.me;
        // trackings = trackings.reverse();
        return res.view('admin/delay', { trackings, me, status: ghtk_status_id.STATUS_ID });
    }
}
