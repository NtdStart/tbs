module.exports = {
    fn: function(input){
        const str = input.toString();
        let arr = str.split(''); // ['1' , '0', '0','0','0','0','0']
    
        let count = 0;
        for(let i = arr.length - 3; i > 0; i -= 3){
             arr.splice( i, 0, '.');
            count++;
        }
            return arr.join('');
    }
}