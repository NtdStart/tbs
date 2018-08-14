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

                let delay = await Tracking.find({
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
                let notHandledDelay = [];
                delay.forEach(d => {
                    if (d.isHandled == false) {
                        notHandledDelay.push(d)
                    }
                })


                sails.sockets.broadcast('cskh', 'new-tracking', { newDelayTracking, newTracking, status: ghtk_status_id.STATUS_ID });
                sails.sockets.broadcast('cskh', 'server-send-delay-not-handle', { newDelayTracking, notHandledDelay });

            } else {
                sails.sockets.broadcast('cskh', 'new-tracking', { newTracking, status: ghtk_status_id.STATUS_ID })
            }

            return res.ok();
        }

        if (tracking) {
            let isHandled = false;
            const updatedTracking = await Tracking.updateOne({ label_id }, { isHandled, data: tracking.data + ";" + newData, reason });

            if (!updatedTracking) return res.send('failed to update');

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
                let notHandledDelay = [];
                delay.forEach(d => {
                    if (d.isHandled == false) {
                        notHandledDelay.push(d)
                    }
                })

                sails.sockets.broadcast('cskh', 'server-send-delay-not-handle', { updatedTracking, notHandledDelay });
            }

            sails.sockets.broadcast('cskh', 'update-tracking', { updatedTracking, status: ghtk_status_id.STATUS_ID });

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
        let notHandledDelay = [];

        notHandles.forEach(tracking => {

            if (tracking.isHandled == false  ) {
                notHandledDelay.push(tracking)
            }
        })

        sails.sockets.broadcast('cskh', 'server-send-delay-not-handle', { notHandledDelay });

        return res.view('admin/index', { trackings, notHandledDelay, me, status: ghtk_status_id.STATUS_ID, code: ghtk_status_id.REASON_CODE })
    },

    handling: async function (req, res) {
        // const nameUser = req.me.fullName;
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

        sails.sockets.broadcast('cskh', 'server-send-Message', { updatedTracking });
        sails.sockets.broadcast('cskh', 'server-send-delay-not-handle', { handledDelay: updatedTracking });
        return res.redirect("..");
    },

    getAllDelay: async function (req, res) {
        if (!req.me) {
            return res.redirect('/');
        }

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

        const me = req.me;
        // trackings = trackings.reverse();
        let notHandledDelay = [];
        trackings.forEach(tracking => {
            if (tracking.isHandled == false) {
                notHandledDelay.push(tracking)
            }
        })
        notHandledDelay.forEach(e => {
            for (let i = 0; i < ghtk_status_id.STATUS_ID.length; i++) {
                if (ghtk_status_id.STATUS_ID[i].status_id == e.arrJson[e.arrJson.length - 1].status_id) {
                    e.status_info = ghtk_status_id.STATUS_ID[i].description;
                }
            }
        })

        console.log(notHandledDelay);

        return res.view('admin/delay', { trackings, notHandledDelay, me, status: ghtk_status_id.STATUS_ID });
    },

    getDelayNotHandled: async function (req, res) {
        const {id} = req.body;
        let notHandledDelay = await Tracking.find({ isHandled: 'false' })
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
            
            let unhandle;
            notHandledDelay.forEach((e, index) => {
                if( e.label_id == id){
                    unhandle = e;
                }
            })

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

        sails.sockets.broadcast('cskh', 'server-send-delay-not-handle', { unhandle, notHandledDelay });
        sails.sockets.broadcast('cskh', 'server-send-an-unhandle', { unhandle });

    },

}
