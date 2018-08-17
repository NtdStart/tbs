module.exports = {

    index: async function (req, res) {
        if (!req.isSocket) return res.badRequest()
        var socketId = sails.sockets.getId(req)


        sails.log('My socket ID is: ' + socketId)
        sails.sockets.join(req, 'cskh', function (err) {
            if (err) { return res.serverError(err); }
            res.ok()
        });
    },

    gHTKWebHooks: async function (req, res) {
        sails.log(req.body);

        let { label_id, partner_id, status_id, action_time, reason_code, reason, weight, fee, pick_money } = req.body;
        pick_money = convertTypeCurr.fn(pick_money);
        fee = convertTypeCurr.fn(fee);
        const newData = JSON.stringify({ partner_id, status_id, action_time, reason_code, reason, weight, fee, pick_money })
        const tracking = await Tracking.findOne({ 'label_id': label_id }).catch(error => sails.log(error));
        if (!tracking) {
            const newTracking = await Tracking.create({ label_id, data: newData, status_id, reason }).fetch()
            if (!newTracking) return res.send('cannot create tracking');
            const arrData = [];
            arrData.push(newTracking.data); //mảng string obj
            const arr = [];
            arrData.forEach(a => {
                let dataJson = JSON.parse(a);
                dataJson['action_time'] = convert_time.fn(dataJson['action_time']);
                arr.push(dataJson);
            })

            newTracking['arrJson'] = arr;
            newTracking.arrHandling = [];
            newTracking.status_id = status_id;
            newTracking.isHandled = false;

            for (let i = 0; i < ghtk_status_id.STATUS_ID.length; i++) {
                if (ghtk_status_id.STATUS_ID[i].status_id == newTracking.arrJson[newTracking.arrJson.length - 1].status_id) {
                    newTracking.status_info = ghtk_status_id.STATUS_ID[i].description;
                }
            }
            let newDelayTracking;
            if (newTracking.status_id == "4" && newTracking.arrJson[0].reason != '' || newTracking.status_id == "9" || newTracking.status_id == "10" || newTracking.status_id == "49" || newTracking.status_id == "410") {
                newDelayTracking = newTracking;

                let delays = await Tracking.find({
                    where:
                    {
                        or:
                            [{
                                status_id: 4,
                                reason: { '!=': '' }
                            },
                            { status_id: "9" },
                            { status_id: "10" },
                            { status_id: "49" },
                            { status_id: "410" }]
                    }
                }).sort('updatedAt DESC').catch(e => res.send('error: ' + e));
                let notHandledDelays = [];
                delays.forEach(d => {
                    if (d.isHandled == false) {
                        notHandledDelays.push(d)
                    }
                })

                sails.sockets.broadcast('cskh', 'new-tracking', { newDelayTracking, newTracking, status: ghtk_status_id.STATUS_ID });
                sails.sockets.broadcast('cskh', 'server-send-delay-not-handle', { newDelayTracking, notHandledDelays });

            } else {
                sails.sockets.broadcast('cskh', 'new-tracking', { newTracking, status: ghtk_status_id.STATUS_ID })
            }
            return res.ok();
        }

        else {
            let isHandled = false;
            const updatedTracking = await Tracking.updateOne({ label_id },{ isHandled, data: tracking.data + ";" + newData, reason,status_id });

            if (!updatedTracking) return res.send('failed to update');

            const arrData = updatedTracking.data.split(';');  //mảng string các obj
            const arr = [];
            arrData.forEach(a => {
                let dataJson = JSON.parse(a);
                dataJson['action_time'] = convert_time.fn(dataJson['action_time']);
                arr.push(dataJson);
            })

            updatedTracking.reason = reason;
            updatedTracking['arrJson'] = arr;

            if (updatedTracking.handling) {
                const arrHandling = updatedTracking.handling.split(';;');
                updatedTracking['arrHandling'] = arrHandling;
            }

            for (let i = 0; i < ghtk_status_id.STATUS_ID.length; i++) {
                if (ghtk_status_id.STATUS_ID[i].status_id == updatedTracking.arrJson[updatedTracking.arrJson.length - 1].status_id) {
                    updatedTracking.status_info = ghtk_status_id.STATUS_ID[i].description;
                }
            }

            if (updatedTracking.status_id == "4" && updatedTracking.arrJson[0].reason != '' || updatedTracking.status_id == "9" || updatedTracking.status_id == "10" || updatedTracking.status_id == "49" || updatedTracking.status_id == "410") {

                let delay = await Tracking.find({
                    where:
                    {
                        or: [{
                            status_id: 4,
                            reason: { '!=': '' }
                        },
                        { status_id: "9" },
                        { status_id: "10" },
                        { status_id: "49" },
                        { status_id: "410" }]
                    }
                }).sort('updatedAt DESC').catch(e => res.send('error: ' + e));
                let notHandledDelays = [];
                delay.forEach(d => {
                    if (d.isHandled == false) {
                        notHandledDelays.push(d)
                    }
                })

                sails.sockets.broadcast('cskh', 'server-send-delay-not-handle', { updatedTracking, notHandledDelays });
            }

            sails.sockets.broadcast('cskh', 'update-tracking', { updatedTracking, status: ghtk_status_id.STATUS_ID });
            return res.ok();
        }
    },

    getAllTrackings: async (req, res) => {
        if (!req.me) return res.redirect('/');
        
        let trackings = await Tracking.find({})
            .sort('createdAt DESC')
            .catch(e => console.log('error: ' + e));
        if (!trackings) trackings = [];
        trackings = convert_to_array_json.convert(trackings);

        const me = req.me;

        let notHandles = await Tracking.find({
            where:
            {
                or:
                    [{
                        status_id: 4,
                        reason: { '!=': '' }
                    },
                    { status_id: "9" },
                    { status_id: "10" },
                    { status_id: "49" },
                    { status_id: "410" }]
            }
        })
        let notHandledDelays = [];

        notHandles.forEach(tracking => {

            if (tracking.isHandled == false  ) {
                notHandledDelays.push(tracking)
            }
        })

        sails.sockets.broadcast('cskh', 'server-send-delay-not-handle', { notHandledDelays });

        return res.view('admin/tracking/index', { 
            trackings, 
            notHandledDelays,
            me, 
            status: ghtk_status_id.STATUS_ID, 
            code: ghtk_status_id.REASON_CODE 
        })
    },

    handling: async function (req, res) {
        const me = req.me;
        const { messageSocket, message, label_id } = req.body;

        const tracking = await Tracking.findOne({ "label_id": label_id }).catch(error => sails.log(error));
        if (!tracking) tracking = {};

        const updated = await Tracking.updateOne({ "label_id": label_id }, { handling: tracking.handling ? tracking.handling + ";;" + messageSocket + `[${me.fullName}]` : "" + messageSocket + `[${me.fullName}]` });
        if (!updated) res.send('cannot update tracking');

        const arrData = updated.data.split(';');  //mảng string các obj
        const arr = [];

        arrData.forEach(a => {
            let dataJson = JSON.parse(a);
            dataJson['action_time'] = convert_time.fn(dataJson['action_time']);
            arr.push(dataJson);
        })

        updated['arrJson'] = arr;

        let arrHandling;
        if (updated.handling) {
            arrHandling = updated.handling.split(';;');
            updated['arrHandling'] = arrHandling;
        }

        let isHandled = true;
        if (updated.arrHandling.length < updated.arrJson.length) {
            isHandled = false;
        }

        const updatedTracking = await Tracking.updateOne({ "label_id": label_id }, { isHandled });

        updatedTracking['arrJson'] = arr;
        updatedTracking['arrHandling'] = arrHandling;

        let delays = await Tracking.find({})
            .where({
                or:
                    [{
                        status_id: 4,
                        reason: { '!=': '' }
                    },
                    { status_id: "9" },
                    { status_id: "10" },
                    { status_id: "49" },
                    { status_id: "410" }]
            
            })
            .sort('updatedAt DESC')
            .catch(e => res.send('error: ' + e));
            let notHandledDelays = [];
            delays.forEach(d => {
                if(d.isHandled == false){
                    notHandledDelays.push(d);
                }
            })
            
        sails.sockets.broadcast('cskh', 'server-send-Message', { updatedTracking });
        if(updatedTracking.arrHandling >= updatedTracking.arrJson){
            sails.sockets.broadcast('cskh', 'server-send-handled-delay', { handledDelay: updatedTracking, notHandledDelays });
        }
        return res.redirect("..");
    },

    getAllDelays: async function (req, res) {
        if (!req.me) return res.redirect('/');

        let delays = await Tracking.find({
            where:
            {
                or:
                    [{
                        status_id: "4",
                        reason: { '!=': '' }
                    },
                    { status_id: "9" },
                    { status_id: "10" },
                    { status_id: "49" },
                    { status_id: "410" },
                    { status_id: { "!=": "6"} },]
            }
        })
            .sort('updatedAt DESC')
            .catch(e => res.send('error: ' + e));

        if (!delays) return delays = [];

        delays = convert_to_array_json.convert(delays);

        const me = req.me;
        let notHandledDelays = [];
        delays.forEach(tracking => {
            if (tracking.isHandled == false) {
                notHandledDelays.push(tracking)
            }
        })

        notHandledDelays.forEach(e => {
            for (let i = 0; i < ghtk_status_id.STATUS_ID.length; i++) {
                if (ghtk_status_id.STATUS_ID[i].status_id == e.arrJson[e.arrJson.length - 1].status_id) {
                    e.status_info = ghtk_status_id.STATUS_ID[i].description;
                }
            }
        })
 
        let trackings = [];
        delays.forEach(tracking => {
            if (tracking.status_id != 6 && tracking.status_id != 21 && tracking.status_id != 45 && tracking.status_id != 11) {
                trackings.push(tracking)
            }
        })
        return res.view('admin/tracking/delays', { trackings, notHandledDelays, me, status: ghtk_status_id.STATUS_ID });
    },

    getUnhandle: async function (req, res) {

        const me = req.me;
        // console.log(req.body.id);
        console.log(req.body);
        const { id } = req.body;

        let unhandle = await Tracking.findOne({ label_id: id }).catch(e => res.send(e))
           if(!unhandle) res.send('cannot find unhandle')
            console.log(unhandle);
            
            if (unhandle.handling) {
                const arrHandling = unhandle.handling.split(';;');
                unhandle['arrHandling'] = arrHandling;
            }

            const arrData = unhandle.data.split(';'); 
            const arr = [];
            arrData.forEach(a => {
                let dataJson = JSON.parse(a);
                dataJson['action_time'] = convert_time.fn(dataJson['action_time']);
                arr.push(dataJson);
            })
            unhandle['arrJson'] = arr;
            for (let i = 0; i < ghtk_status_id.STATUS_ID.length; i++) {
                if (ghtk_status_id.STATUS_ID[i].status_id == unhandle.arrJson[unhandle.arrJson.length - 1].status_id) {
                    unhandle.status_info = ghtk_status_id.STATUS_ID[i].description;
                }
            }
            // console.log(unhandle);

            let trackings = await Tracking.find({
                where:
                {
                    or:
                        [{
                            status_id: 4,
                            reason: { '!=': '' }
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

            // trackings = trackings.reverse();
            let notHandledDelays = [];
            trackings.forEach(tracking => {
                if (tracking.isHandled == false) {
                    notHandledDelays.push(tracking)
                }
            })
            notHandledDelays.forEach(e => {
                for (let i = 0; i < ghtk_status_id.STATUS_ID.length; i++) {
                    if (ghtk_status_id.STATUS_ID[i].status_id == e.arrJson[e.arrJson.length - 1].status_id) {
                        e.status_info = ghtk_status_id.STATUS_ID[i].description;
                    }
                }
            })

        sails.sockets.broadcast('cskh', 'server-send-delay-not-handle', { unhandle, notHandledDelays });
        // sails.sockets.broadcast('cskh', 'server-send-an-unhandle', { unhandle });
        return res.view('admin/tracking/unhandle', { unhandle, notHandledDelays, me, layout: null});
    },

    upImage: async function(req, res){
        req.file('image').upload({
            // don't allow the total upload size to exceed ~100MB
            maxBytes: 2000000,
            // set the directory
            dirname: '../../assets/images/handles'
          },function (err, uploadedFile) {
            // if error negotiate
            if (err) return res.negotiate(err);
            // logging the filename
            console.log(uploadedFile.filename);
            // send ok response
            return res.ok();
          })
    },

}
