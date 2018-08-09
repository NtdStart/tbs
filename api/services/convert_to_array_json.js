module.exports = {
    convert: function(trackings){
        trackings.forEach((tracking, index) => {
            const arrData = tracking.data.split(';');  //mảng string các obj
            const arr = [];
            arrData.forEach(a => {
                let dataJson = JSON.parse(a);
                dataJson['action_time'] = convert_time.fn(dataJson['action_time']);
                arr.push(dataJson);
            })

            tracking['arrJson'] = arr;

            if (tracking.handling) {
                const arrHandling = tracking.handling.split(';;');
                tracking['arrHandling'] = arrHandling;
            }
            
        })
        return trackings;
    }
}