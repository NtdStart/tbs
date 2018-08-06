module.exports = {
    track: async function(req, res){
        sails.log(req.body);
        const data = JSON.stringify(req.body);
        await Order.create({ data }).fetch();
        return res.send(req.body);
    }
}