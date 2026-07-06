const successResponse =(res, message, items)=>{
    return res.status(200).json({
        success:true,
        message,
        items
    });
} 

const badRequestResponse = (res, message)=>{
        return res.status(400).json({
        success:false,
        message,
        items: null
    });
}

const errorResponse = (res, message)=>{
    return res.status(500).json({
        success: false,
        message,
        items:null
    })
}

const unauthorizedResposne = (res, message) =>{
    return res.status(401).json({
        success:false,
        message,
        user:null
    });
}

module.exports = {
  successResponse,
  badRequestResponse,
  errorResponse,
  unauthorizedResposne
};