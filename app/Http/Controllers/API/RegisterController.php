<?php
   
namespace App\Http\Controllers\API;
   
use Illuminate\Http\Request;
use App\Http\Controllers\API\BaseController as BaseController;
use Validator;
use Illuminate\Support\Facades\DB;
use Kreait\Firebase;
use Kreait\Firebase\Factory;
use Kreait\Firebase\ServiceAccount;



class RegisterController extends BaseController
{
    public function generateRandomString($length) {
        $characters = '0123456789';
        $charactersLength = strlen($characters);
        $randomString = '';
        for ($i = 0; $i < $length; $i++) {
            $randomString .= $characters[random_int(0, $charactersLength - 1)];
        }
        return $randomString;
    }
  
    public function saveURL(Request $request)
    {
        $id = $this->generateRandomString(2);
        print_r($id);
       $serviceAccount = ServiceAccount::fromValue([
        'type' => 'service_account',
        "project_id" => "extension-df42c",
        "private_key_id"=> "a9566a26a73c228806c983f2fad7392e2d946ff5",
        "private_key"=> "-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQCxlR0qgSJQEpnO\n3A/X5Mwo1nrpxLaQ2nxql3/7HJr+JlKXWhsvYAgixtnweQAKLH1tY4DApJRvCWGu\nOFEOOOlCGIpX4UylK0/++CKL3F3tWMR4Ie3fSflQdwCBtfP6FU7/tx1KQw7MXbjE\nUVURwNRrOCv7ltbnstRtSI4kc1p1ok0vzgkxorkR7DUOPag+CTV24ebiqqXyP2AA\ntAyV1XTIZvn5xRchF1eXPtEzN/OYgaMUwMe9fAQ15CrO01b49mpGwCjBRtJ9pF9s\nG5o18RdcCmM1Dju6IwxzoaKPmyjevIlI99+9Fwyg4CXsOcg/DG039QWZXj1xMgoi\n6/JBZZ/9AgMBAAECggEALzial9nc2PQJSFOGNv+VNmrKJm1zqpMesG12z7xsjpZ8\nMdj5D6D2qOC9xU83rnzkIXlrHE7nVZtmCSDalPCXPkcuSm4Tpnwc+ozbCtvfciS/\nob5L9atDC52JWfSbWu3douv7curf/YIShsml2GGxWo2GTJFwtg38pM69VX4DGPJN\nEy8hDLgdpf7RLw7/D0viZcaFdFA5+iolBWnfzjFIua+RShLJp3LX2kheftgCUoWf\nwrEIJ+Y4Q58x05YZZPH8234Xe4KYG1SRQEA3H4sxj6y/sQOTGRaz9++kFbUfsvde\nr1+UZXgnQnY3MedgBImYIt7rQnci5IOzP83u9rkRtQKBgQDfxb4piJk9Z0MVzx/o\nZUNjuExofNTbyyATPuQ8Pwlp5h9T7gGPfZvi4BQ3tixMIsAO1Hl6ALImsToj6sX4\nnrzF2vkpDHYTifNcj/lNfR7NvykeAKzy6nF1t7K7ZBLu6ZJdxWiDpjGHbTzk8Zlh\nxhZCT/ki8EyaCcO4rgrHX7b6fwKBgQDLKGU34ATKpv77SaGpmh8QjG8bFQfr/hO4\ntF9ByaubyPcH9YWwiBuV5eQ9CsfMnhShoP/iRHzjWjfsnSj8WxYUv0o1fd/PAlAI\n8bTemH/F65VoFPCY0THrIfH80VkcLhY9sGO4NXGA/crc2esod8rHUR5NQk6+KMyl\nKqYpauoPgwKBgQCCVu69yHfhoS0dHejq91i6U9YFonhlkbocG6zbPqhgC49B1scH\n6lULYBPGo5DHxBH0UWR0YMVj7iT8WLp5ZxRzdmlctIpuNRMQXjgLH476rpbnh+M1\nFsOBmr87kT3J9Tiw79RBomMFC+bFP8hkf/nlJCnsZOVpb7iV8KIMoT62RwKBgQDA\nNX7WR3+hEDCMJRTrtuKPMJ7p+5LcJy4XgafiQWC4aoG2KQgMhim7P58aVbnFEQcq\nCH4wYGXcYH4qwmKFp9QTWwxl4aq/W0vHuo9KTvQMmKBpse4UV1AoS5x8esEZVU07\nnkgqf33c8cFeBFtllTjoLQpDRGnlpgpAdkJxSzMZ6wKBgBDMcO3k8JmFX04wZETB\n5gHZbRmEO0TBf71hjmuOA7WoU2i+JfTx/d1fyPBATvRZ4O2LQa0tq3pcx5S6e/dw\nam0e/yilieyProBo/rMPFmP76z1BN6CKa1ew5o0owcbNRFwQNVrWpjKWkyKqedla\nnvUA+I787jv1Dzw7WuYLVoCf\n-----END PRIVATE KEY-----\n",
        "client_email"=> "firebase-adminsdk-96ahg@extension-df42c.iam.gserviceaccount.com",
        "client_id"=> "109771786181829439545",
        "auth_uri"=> "https://accounts.google.com/o/oauth2/auth",
        "token_uri"=> "https://oauth2.googleapis.com/token",
        "auth_provider_x509_cert_url"=> "https://www.googleapis.com/oauth2/v1/certs",
        "client_x509_cert_url"=> "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-96ahg%40extension-df42c.iam.gserviceaccount.com"
        ]);
        $firebase = (new Factory)
            ->withServiceAccount($serviceAccount)
            ->withDatabaseUri('https://extension-df42c-default-rtdb.firebaseio.com')
            ->createDatabase();  
        
        $reference = $firebase->getReference('root');
        $value = $reference->getValue();
        $machineId = gethostbyaddr($_SERVER['REMOTE_ADDR']);
        $refer = base64_encode($machineId);
       $message = $request->url;
       $key = "EncryptionApp";
       $iv = random_bytes(16);
        $encrypted_message = base64_encode($message);

        if(!empty($request->url) and !empty($request->machineid)){
        $newData = $firebase->getReference('root/history'.$refer)
        ->push([
            'url' => $encrypted_message,
            'machineid' => $machineId,
            'date' => date('Y-m-d'),
            'time' => date('H:i:s')
        ]);
    }
        return response()->json($reference->getValue());
                
    }

    

}