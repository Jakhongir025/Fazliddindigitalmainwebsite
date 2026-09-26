'use strict';
const {configuration,configurationIssues}=require('../lib/leads');
module.exports=(req,res)=>{
 res.setHeader('Cache-Control','no-store');
 if(req.method!=='GET'){res.setHeader('Allow','GET');return res.status(405).json({ok:false});}
 // Never expose environment variables, tokens, spreadsheet IDs or private URLs.
 const config=configuration();
 if(!config)console.warn('Lead form configuration missing or invalid: '+configurationIssues().join(', '));
 return res.status(200).json({enabled:Boolean(config)});
};
