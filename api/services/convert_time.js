module.exports = {
    fn: function (string){
        const day = string.slice(8,10);
        const month = string.slice(5,7);
        const year = string.slice(0,4);
        const hour = string.slice(11,13);
        const minute = string.slice(14,16);

        return  day + "/" + month + "/" + year + " - " + hour + ":" + minute;
    }
}