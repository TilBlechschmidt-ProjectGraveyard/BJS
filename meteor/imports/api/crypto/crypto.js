import CryptoJS from "crypto-js";
import {Log} from "./../log";

var TYPE1_PEPPER = "n+sbYWqp@D_E%eTg!ae$NEJ--HzkRze&8MqbcfGA&M^jw^tRZFPabB9SqmuZQd6KpAVZky5tjK^k=yf_4gk35rN7v2f?p&Yq5=C5tRf&#2g-8L@CYM?fkPM=jhMhWR_?sjYA=aj+9?EL+uKpb!BT5Pr&#BTLgAf5h_*#QmVm&cL!7YRaLDY+5#DnWdcq4gg_C+6!ub$!YjRfh^DE4D=xmQY^tBb6z=x6x=d4gW5Wqq+5zRj?Yf6GGc6whx$Xru_3qsVL6$Gj@c=N_fdn!nR8!MNj=wVRu-Fu=GpQ7zB!eS5T-+Z-XjJ9W==Z%uf5wZ85?YPVq6$XJAa*BdyV_pCs9faCx2pZ!8vjX#Df_t4k34q7frU&#!P=ssE@9Z!&cbzw9KcNGAxNDRATQ9b&3n@=LgvZ&gbujefX&fd8yGgPYaZ7VR2SSpb%9sYa524a2nQNA%vmZ+qL-*6kRZyQGu!2rCu_xbmYv@acd8PAqc2Yz_v2ybR!4^XE3ZGPh3xC5GqHhY_MQrQ@enUTj@JhG^MtjKKqJTpc6T7A=xvxc5CGAc#HG9fN-Y#uvdZpa@&SUdX!JuMk@$dm%5*h4LewLAE3!dCqjQm?k%%L=#X!udLQ-Dz#+KTrvGCe8&YgxM-_-2&26e=RJ?q8nJP&23eA58HM7$Q4g58tp&-Wzd$JgjUYyLns%hGC6PUA^Ug3Rzpf9C5nQ+_TM+9dTu-#mn6b^EzBh3Fm6F=P^2vxkNkbbgx8MYF-sLJf5QRZzHsex&b&$&EQeA%GvLqb9cftYTHuh6KB^tfYan83FX^k&avE=_jByy2YAprevKpT-A3-jffc$GgBZR@?C$L-24Fs=MnYuxv%=TQ^A$$8*CjdyjxJqh#5NfE8XC%7wN%b4Zcm9rJ9_h+s_*2LbevZ8qDUkTYW-V76g3F!pzj$yxCPadKV6^@K&pF485JjG9E_F&=7hSQEf!c_nB2!d@WbQa&=wq8SXWqMYSsumX4=*a-Ud?+%-5a^ctAbw8VPTge9z^rC^@M%pS?m3K-*fm!DUEv5gHM9FrnWWuypj!4?rJyrmm$%p#Z$^42RqqK$BPm-ARANn?2*Ty!*T_j5-Bp36AMKS7Q%#xYgRP*YP6vD^7KFv4b5yHNFgQ-ZV*QVhcTA_XsDBtrSnk#AU*&RyW$=mzJ5az=NndGTQZgzM++GUt*Qs=s_C5Urkw9W?T%Gq3ktnWqxJcrZzX#D-h_73gD#+kLR3TRPBRVCS!SrvB*v_y-$$M$dHfumkeasR#p!n2NP*hYL?=Rf4GQ^*6e@ft+qk#C6@67dmwDkcDJFaL5=!NmMGenGngVuftPxfbeRQ&MEfbyC+8Q&EG3p=arbB_4KhhWz#hgcMja%73wfuwdLvc^%XgAvqf8F+bMkTZmAuy_GF@=xrBpKfpTRw6ALhYAVfAYr9gvtzY#FM6??&DPSzKsDfvpY8KQaL7uY-EyNQBhf9*q+ASGe3gV+JrH*xtD_4TR@DES#xnyFu9V3g2$&K4Lu5CBg94M_sRRf#92jzmZu9GR&6VynKmwUcPk3USg?Zj_-W7?AW-QKMzQX+2LD6GqkQsLWMEgG3rPHx3jvme^#ykC^_2pH@$$r^*Z@H%zJsSUK+3F2pNXvLW_DpZHPQDXdL^Wq7xnWb4+4A^5Rg9Z3YGw?mYZDsu9RKwN^6bu-Bw*HPu2hdL4EG_HE*Q57NZr!x9+bQRcTw*^8zxaq7uT#TaqFRnPBjVN#StQzbM2!fj2Qf4ZDUm_F$LL!?ua9@CEfM_WZEYBQ4wz@LFJ#ynpHYDYKMYyvNNXT7WVypknph#kqQ!wUcqQ4-QGJK566ag93wquGjawG8^yzvf98E=?=Lmh8^Sbm6tupMNJUD4W6#7T5K=J7LX2mr8^y4FW9k*b9#T9ajACpzvuxqg964ddD4YJ6wVcW=5B4ZWwyQ4_y-HaR2@jkguhB43L8$W?=#rpFZKpZUsGtJyqVwA+B_CAXcLP-8AqTqWhDcuRRfWf!Rr8GtFN4pJUfw6!aAc8jay5w&9TEhgk$YDx5GbW!YyKP@rCuJDRzcM^R";
var TYPE2_PEPPER = "B%SaY*RK#NTJEA-4D-9UkBc@rB9Y9aFAeK^5P*my$$2WZkht9*dY9aLrq$ruaHTT8QH*^Ty6eEL#P@zFLAaR9J7J#GQ3@A?3RBdMw8?=Lw9d?$y_Sw5kAnd&xDk&-=KJ3TA$SM*@FMtFGGy8w8?8Aj5n3C!DVLn*quqvGQpgcYAZd_Vku#Lb4J$RmH_=fKQREx&gs%@ezyrLVQJUJZ*wUCFWM43T%6kH@J7@PLDeLbP!qN#6QuvS-TNK^emUBWGR@5EhEVz*NDM^%^PHSpKS5^#nj%6hJWtuK^*6rpFba8jFB=zWb&BLbyfP9H8vSk^$+swj#mKkb^cf7SyPZB2%%v9uK+fbsrtYV8YKpUUBYdg9YnfUrMAL!?6tMzurDgS49mHkvK3%#g@*^vqz#zQzYg8-+&%pXk49Bc$v$XQQ5a@zH@%p85TzMHP6uHQPjXeMU8CtHBWYf8u6g#4%+P@pH!JyDXS9=Bj#EegR^&-xY^_7NX%8LNnMYph%7qv$YmhBDzA3TqDWJJC!V5fUeNV_$Qm=kdmzW8ZQT%q-7PCGKsPWH+5#*4UW@yKVZdtuqxkPC&EpUwsns2d?VuB2XFc9puAg-&jj@h?s*T8RXphK4HFd-n%N*vbVX8$WASC@v#4cu8ZYecy#duATyq5hQ_hK#hZ9eq6UzHzG++Gg4u?E*Vw8Bfp-XZ%SYRW$7pBxAqWU6A?595&XqU#8L2q9kkZ7nWXXBeW4%L4PhXc@mG57kEX=A=kXHZkLZ28p&34^pA6KM$t+rN#t6TLm!$S7t-77FQm3AZtsja#MYbW9Umd6F8h?w=jxhERWzJPY@q9kFA&y^XUj=gZB#C%rvU8!J*nRU23@8N?L9N&Z9K7bh5*y_47@AJsvpjvxup*G8Rry5v*DEunWKt#=fPWCfLBEkNt^2qQGL+cC3%*C+pSCJdbE_UQRQtLJ2N79xBp7ty#32nn2&2e%2rjB2xkMsQ*fz2$BPZWMf&prEffm4qM5D*_pN%7vuXub+Y#QR^J27DUQ!!Hu_@J3&aUFTbv4-Ey@yQ7Zp_exUL*rAVBfZg%bAD@-xj-mvv6-*TP$MdRThr$2Uz!T8u4Wbz!DnYfTmcyERTxsKGfWcafyS*2F?2D9hRm!?NmWfnzN=mvu4-?hkqnJB#W-xq4U24SMM8bcE*GU7ZDEvS75FJTRbsuV46&d^y4C3!cKVv%9^eJVDb8=DUQV-npzccqH?k#35hJd7PYm5xRCvqcnap2k!CJ-+*kq32nKKQyzXakuNJJrrnEs_Q&PhWPs7PPtqaJ8*C#=JeN$m6STrsZh$H68pB^X&V_%&zsnyr^a-pq@Y6?gHntp5bvjx5V4+KHueMn#2aPKT2ewVF$^eU7cn!CUnyv@Khd_8pPCCfHuY=8KXF==*cNJz*9&t_#p_Ssa^Cs!Rz6jv4WQGJRJZ9Nk3bRBZ8Af?Jg?C+d5fwQGP6a+wUT3rZ9dctvvrUkS!taJ!^ZMgHrUTdL++67nbh^!33T!3*Jt=PbRYF#nTSLdBVJMt*z*$?cv2?rfVSR_**YJe_AQ+4m6&FjVvgX8+Zy7qC^uM4F!vvtth-!BrDv8nQw6x#=-&b55BLjWRkHEYwcr$8B9GhPK$=8qm8MhMhUgs?wsBgEThdk7Uastf^kAzT2#J62r73aA6#ccNuG-qRE2FTfWMtD#%^73EHyHmeE%nP8Z=jKPwX&y%SvrvhuSMfP57XXTM=jZaujv6UZjYUBH=J2t2%@kaK8ss!nZu_Zu+f6u_&@UT?@zWp*?Q@huWX%eQh*^@CwWa8g7^HMAg^=qKrPtYg-HHu@X&NL!!d7^Q%H_?mu$t2peM%YG%Dy*DLh&c!HQk7aQ+EAZnCNy-v9nF*CBfV_^#?BeK%EzTB2awPYrm#wAFh$$6@H?Nq46zrzgc2zEJ=A#^nqS??aP-gC6YemWBtzVZE%3Sv@&JGeD@hh$AcVB4GJJ5PkCzVCjRh_&r_bKx2U3u3+hFzytSf9tSHdsdpZ#mtxeWJ4b&UuTzB5WbTLW3bF%D&?HPFR9LZpwkzsDJp9ZNv26rJQh";

function wordsToHex(words) {
    //noinspection JSUnresolvedVariable
    return CryptoJS.enc.Hex.stringify(words);
}

// Hash-based message authentication code
function generateHMAC(data, password) {
    //noinspection JSUnresolvedFunction
    return wordsToHex(CryptoJS.HmacSHA512(data, password));
}

// AC = authentication code = object of the hashes and the salt
/**
 * Generates a authentication code for
 * @param password      passwd to generate the auth. code from
 * @param salt [random] optional salt to recreate a auth. code
 * @returns {{salt, pub_hash, priv_hash}}   authentication code
 */
//noinspection JSUnresolvedVariable
export function generateAC(password, salt = CryptoJS.lib.WordArray.random(128 / 8)) {
    if (typeof salt === 'string') { //noinspection JSUnresolvedVariable
        salt = CryptoJS.enc.Utf8.parse(salt);
    }
    //noinspection JSUnresolvedFunction
    return {
        salt: wordsToHex(salt),
        pub_hash: wordsToHex(CryptoJS.PBKDF2(password + TYPE1_PEPPER, salt, {keySize: 512 / 32, iterations: 1000})),
        priv_hash: wordsToHex(CryptoJS.PBKDF2(password + TYPE2_PEPPER, salt, {keySize: 512 / 32, iterations: 1000})),
    };
}

/**
 * Encrypt data and sign it
 * @param data          Data to encrypt
 * @param group_ac      Group auth. code
 * @param station_ac    Station auth. code
 * @returns {{group_signature, station_signature, data: (string|*)}}
 */
export function encrypt(data, group_ac, station_ac) {
    //noinspection JSUnresolvedVariable
    return {
        group_signature: {signature: generateHMAC(data, group_ac.priv_hash), pub_hash: group_ac.pub_hash},
        station_signature: {signature: generateHMAC(data, station_ac.priv_hash), pub_hash: station_ac.pub_hash},
        data: CryptoJS.Rabbit.encrypt(JSON.stringify(data), group_ac.priv_hash).toString()
    };
}

/**
 * Decrypt the signed data and check the signatures.
 * @param signed_enc_data       encrypted and signed data
 * @param group_ac              auth. code of the group
 * @param station_ac []         auth. code of the station (if left out the station signature is not checked!)
 * @returns {{result: boolean|object, log: object}}    either the decrypted data or false if the signature verification failed
 */
export function decrypt(signed_enc_data, group_ac, station_ac) {
    var log = new Log();
    //noinspection JSUnresolvedVariable
    var bytes = CryptoJS.Rabbit.decrypt(signed_enc_data.data, group_ac.priv_hash);
    //noinspection JSUnresolvedVariable
    var data = JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
    var signature_ok = (group_ac.pub_hash == signed_enc_data.group_signature.pub_hash && generateHMAC(data, group_ac.priv_hash) == signed_enc_data.group_signature.signature) &&
        ( typeof station_ac === "object" ? (station_ac.pub_hash == signed_enc_data.station_signature.pub_hash && generateHMAC(data, station_ac.priv_hash) == signed_enc_data.station_signature.signature) : true);

    if (typeof station_ac !== "object") log.addWarning("No station_ac provided! Skipping signature check!");
    if (signature_ok)
        return { // If the signature checks are valid return the data
            result: data,
            log: log
        };
    else
        return { // Else return false
            result: false,
            log: log
        };
}