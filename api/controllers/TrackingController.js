module.exports = {
    GiaoHangTietKiemWebHooks: async function (req, res) {
        // sails.log(req.body);

        const { label_id, partner_id, status_id, action_time, reason_code, reason, weight, fee, pick_money } = req.body;
        const newData = JSON.stringify({ partner_id, status_id, action_time, reason_code, reason, weight, fee, pick_money })

        const tracking = await Tracking.findOne({ 'label_id': label_id }).catch(error => sails.log(error));
        if (!tracking) {
            const newTracking = await Tracking.create({ label_id, data: newData, status_id }).fetch()
            if (!newTracking) return res.send('cannot create tracking');
            // console.log(newTracking);

            return res.ok();
        }
        if (tracking) {

            const updatedTracking = await Tracking.update({ label_id }, { data: tracking.data + ";" + newData }).fetch();
            updatedTracking.status_id = status_id;
            if (!updatedTracking) console.log('failed to update');
            // console.log(updatedTracking);

            res.ok();
        }
    },

    getAllTrackings: async (req, res) => {
        if (!req.me) {
            return res.redirect('/');
        }
        let trackings = await Tracking.find({}).catch(e => console.log('error: ' + e));
        if (!trackings) trackings = [];
        // console.log(trackings);

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

            if (tracking.handling) {
                const arrHandling = tracking.handling.split(';;');
                tracking['arrHandling'] = arrHandling;
            }

        });
        const me = req.me;
        trackings = trackings.reverse();
        return res.view('admin/index', { trackings, me, status: ghtk_status_id.STATUS_ID, code: ghtk_status_id.REASON_CODE })
    },
    handling: async function (req, res) {
        // const nameUser = req.me.fullName;
        const me = req.me;
        const { message, label_id } = req.body;
        const tracking = await Tracking.findOne({ "label_id": label_id }).catch(error => sails.log(error));
        if (!tracking) tracking = {};


        const newTracking = await Tracking.updateOne({ "label_id": label_id }, { handling: tracking.handling ? tracking.handling + ";;" + message + `[${me.fullName}]` : "" + message + `[${me.fullName}]` });
        if (!newTracking) console.log('cannot update tracking');

        return res.redirect('/admin');
    },

    getDelay: async function (req, res) {
        if (!req.me) {
            return res.redirect('/');
        }

        let trackings = await Tracking.find({
            where:
            {
                or:
                    [{ status_id: 4 },
                    { status_id: 9 },
                    { status_id: 10 },
                    { status_id: 49 },
                    { status_id: 410 }
                    ]
            }
        }).catch(e => console.log('error: ' + e));

        if (!trackings) return res.send('tracking empty');


        console.log(trackings);


        trackings.forEach((tracking, index) => {
            // console.log(tracking);
            const arrData = tracking.data.split(';');  //mảng string các obj



            const arr = [];
            arrData.forEach(a => {
                let dataJson = JSON.parse(a);
                dataJson['action_time'] = convert_time.fn(dataJson['action_time']);
                arr.push(dataJson);
                // console.log(JSON.parse(a));
            })

            tracking['arrJson'] = arr;

            if (tracking.handling) {
                const arrHandling = tracking.handling.split(';;');
                tracking['arrHandling'] = arrHandling;
            }
        })
        const me = req.me;
        trackings = trackings.reverse();
        return res.view('admin/delay', { trackings, me, status: ghtk_status_id.STATUS_ID });
    }
}
