function FileConvertSize(aSize){
	aSize = Math.abs(parseInt(aSize, 10));
	var def = [[1, 'octets'], [1000, 'ko'], [1000*1000, 'Mo'], [1000*1000*1000, 'Go'], [1000*1000*1000*1000, 'To']];
	for(var i=0; i<def.length; i++){
		if(aSize<def[i][0]) return (aSize/def[i-1][0]).toFixed(2)+' '+def[i-1][1];
	}
}

module.exports = FileConvertSize;