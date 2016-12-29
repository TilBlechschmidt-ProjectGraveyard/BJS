import CryptoJS from "crypto-js";

const TYPE1_PEPPER = 'n+sbYWqp@D_E%eTg!ae$NEJ--HzkRze&8MqbcfGA&M^jw^tRZFPabB9SqmuZQd6KpAVZky5tjK^k=yf_4gk35rN7v2f?p&Yq5=C5tRf&#2g-8L@CYM?fkPM=jhMhWR_?sjYA=aj+9?EL+uKpb!BT5Pr&#BTLgAf5h_*#QmVm&cL!7YRaLDY+5#DnWdcq4gg_C+6!ub$!YjRfh^DE4D=xmQY^tBb6z=x6x=d4gW5Wqq+5zRj?Yf6GGc6whx$Xru_3qsVL6$Gj@c=N_fdn!nR8!MNj=wVRu-Fu=GpQ7zB!eS5T-+Z-XjJ9W==Z%uf5wZ85?YPVq6$XJAa*BdyV_pCs9faCx2pZ!8vjX#Df_t4k34q7frU&#!P=ssE@9Z!&cbzw9KcNGAxNDRATQ9b&3n@=LgvZ&gbujefX&fd8yGgPYaZ7VR2SSpb%9sYa524a2nQNA%vmZ+qL-*6kRZyQGu!2rCu_xbmYv@acd8PAqc2Yz_v2ybR!4^XE3ZGPh3xC5GqHhY_MQrQ@enUTj@JhG^MtjKKqJTpc6T7A=xvxc5CGAc#HG9fN-Y#uvdZpa@&SUdX!JuMk@$dm%5*h4LewLAE3!dCqjQm?k%%L=#X!udLQ-Dz#+KTrvGCe8&YgxM-_-2&26e=RJ?q8nJP&23eA58HM7$Q4g58tp&-Wzd$JgjUYyLns%hGC6PUA^Ug3Rzpf9C5nQ+_TM+9dTu-#mn6b^EzBh3Fm6F=P^2vxkNkbbgx8MYF-sLJf5QRZzHsex&b&$&EQeA%GvLqb9cftYTHuh6KB^tfYan83FX^k&avE=_jByy2YAprevKpT-A3-jffc$GgBZR@?C$L-24Fs=MnYuxv%=TQ^A$$8*CjdyjxJqh#5NfE8XC%7wN%b4Zcm9rJ9_h+s_*2LbevZ8qDUkTYW-V76g3F!pzj$yxCPadKV6^@K&pF485JjG9E_F&=7hSQEf!c_nB2!d@WbQa&=wq8SXWqMYSsumX4=*a-Ud?+%-5a^ctAbw8VPTge9z^rC^@M%pS?m3K-*fm!DUEv5gHM9FrnWWuypj!4?rJyrmm$%p#Z$^42RqqK$BPm-ARANn?2*Ty!*T_j5-Bp36AMKS7Q%#xYgRP*YP6vD^7KFv4b5yHNFgQ-ZV*QVhcTA_XsDBtrSnk#AU*&RyW$=mzJ5az=NndGTQZgzM++GUt*Qs=s_C5Urkw9W?T%Gq3ktnWqxJcrZzX#D-h_73gD#+kLR3TRPBRVCS!SrvB*v_y-$$M$dHfumkeasR#p!n2NP*hYL?=Rf4GQ^*6e@ft+qk#C6@67dmwDkcDJFaL5=!NmMGenGngVuftPxfbeRQ&MEfbyC+8Q&EG3p=arbB_4KhhWz#hgcMja%73wfuwdLvc^%XgAvqf8F+bMkTZmAuy_GF@=xrBpKfpTRw6ALhYAVfAYr9gvtzY#FM6??&DPSzKsDfvpY8KQaL7uY-EyNQBhf9*q+ASGe3gV+JrH*xtD_4TR@DES#xnyFu9V3g2$&K4Lu5CBg94M_sRRf#92jzmZu9GR&6VynKmwUcPk3USg?Zj_-W7?AW-QKMzQX+2LD6GqkQsLWMEgG3rPHx3jvme^#ykC^_2pH@$$r^*Z@H%zJsSUK+3F2pNXvLW_DpZHPQDXdL^Wq7xnWb4+4A^5Rg9Z3YGw?mYZDsu9RKwN^6bu-Bw*HPu2hdL4EG_HE*Q57NZr!x9+bQRcTw*^8zxaq7uT#TaqFRnPBjVN#StQzbM2!fj2Qf4ZDUm_F$LL!?ua9@CEfM_WZEYBQ4wz@LFJ#ynpHYDYKMYyvNNXT7WVypknph#kqQ!wUcqQ4-QGJK566ag93wquGjawG8^yzvf98E=?=Lmh8^Sbm6tupMNJUD4W6#7T5K=J7LX2mr8^y4FW9k*b9#T9ajACpzvuxqg964ddD4YJ6wVcW=5B4ZWwyQ4_y-HaR2@jkguhB43L8$W?=#rpFZKpZUsGtJyqVwA+B_CAXcLP-8AqTqWhDcuRRfWf!Rr8GtFN4pJUfw6!aAc8jay5w&9TEhgk$YDx5GbW!YyKP@rCuJDRzcM^R';
const TYPE2_PEPPER = 'B%SaY*RK#NTJEA-4D-9UkBc@rB9Y9aFAeK^5P*my$$2WZkht9*dY9aLrq$ruaHTT8QH*^Ty6eEL#P@zFLAaR9J7J#GQ3@A?3RBdMw8?=Lw9d?$y_Sw5kAnd&xDk&-=KJ3TA$SM*@FMtFGGy8w8?8Aj5n3C!DVLn*quqvGQpgcYAZd_Vku#Lb4J$RmH_=fKQREx&gs%@ezyrLVQJUJZ*wUCFWM43T%6kH@J7@PLDeLbP!qN#6QuvS-TNK^emUBWGR@5EhEVz*NDM^%^PHSpKS5^#nj%6hJWtuK^*6rpFba8jFB=zWb&BLbyfP9H8vSk^$+swj#mKkb^cf7SyPZB2%%v9uK+fbsrtYV8YKpUUBYdg9YnfUrMAL!?6tMzurDgS49mHkvK3%#g@*^vqz#zQzYg8-+&%pXk49Bc$v$XQQ5a@zH@%p85TzMHP6uHQPjXeMU8CtHBWYf8u6g#4%+P@pH!JyDXS9=Bj#EegR^&-xY^_7NX%8LNnMYph%7qv$YmhBDzA3TqDWJJC!V5fUeNV_$Qm=kdmzW8ZQT%q-7PCGKsPWH+5#*4UW@yKVZdtuqxkPC&EpUwsns2d?VuB2XFc9puAg-&jj@h?s*T8RXphK4HFd-n%N*vbVX8$WASC@v#4cu8ZYecy#duATyq5hQ_hK#hZ9eq6UzHzG++Gg4u?E*Vw8Bfp-XZ%SYRW$7pBxAqWU6A?595&XqU#8L2q9kkZ7nWXXBeW4%L4PhXc@mG57kEX=A=kXHZkLZ28p&34^pA6KM$t+rN#t6TLm!$S7t-77FQm3AZtsja#MYbW9Umd6F8h?w=jxhERWzJPY@q9kFA&y^XUj=gZB#C%rvU8!J*nRU23@8N?L9N&Z9K7bh5*y_47@AJsvpjvxup*G8Rry5v*DEunWKt#=fPWCfLBEkNt^2qQGL+cC3%*C+pSCJdbE_UQRQtLJ2N79xBp7ty#32nn2&2e%2rjB2xkMsQ*fz2$BPZWMf&prEffm4qM5D*_pN%7vuXub+Y#QR^J27DUQ!!Hu_@J3&aUFTbv4-Ey@yQ7Zp_exUL*rAVBfZg%bAD@-xj-mvv6-*TP$MdRThr$2Uz!T8u4Wbz!DnYfTmcyERTxsKGfWcafyS*2F?2D9hRm!?NmWfnzN=mvu4-?hkqnJB#W-xq4U24SMM8bcE*GU7ZDEvS75FJTRbsuV46&d^y4C3!cKVv%9^eJVDb8=DUQV-npzccqH?k#35hJd7PYm5xRCvqcnap2k!CJ-+*kq32nKKQyzXakuNJJrrnEs_Q&PhWPs7PPtqaJ8*C#=JeN$m6STrsZh$H68pB^X&V_%&zsnyr^a-pq@Y6?gHntp5bvjx5V4+KHueMn#2aPKT2ewVF$^eU7cn!CUnyv@Khd_8pPCCfHuY=8KXF==*cNJz*9&t_#p_Ssa^Cs!Rz6jv4WQGJRJZ9Nk3bRBZ8Af?Jg?C+d5fwQGP6a+wUT3rZ9dctvvrUkS!taJ!^ZMgHrUTdL++67nbh^!33T!3*Jt=PbRYF#nTSLdBVJMt*z*$?cv2?rfVSR_**YJe_AQ+4m6&FjVvgX8+Zy7qC^uM4F!vvtth-!BrDv8nQw6x#=-&b55BLjWRkHEYwcr$8B9GhPK$=8qm8MhMhUgs?wsBgEThdk7Uastf^kAzT2#J62r73aA6#ccNuG-qRE2FTfWMtD#%^73EHyHmeE%nP8Z=jKPwX&y%SvrvhuSMfP57XXTM=jZaujv6UZjYUBH=J2t2%@kaK8ss!nZu_Zu+f6u_&@UT?@zWp*?Q@huWX%eQh*^@CwWa8g7^HMAg^=qKrPtYg-HHu@X&NL!!d7^Q%H_?mu$t2peM%YG%Dy*DLh&c!HQk7aQ+EAZnCNy-v9nF*CBfV_^#?BeK%EzTB2awPYrm#wAFh$$6@H?Nq46zrzgc2zEJ=A#^nqS??aP-gC6YemWBtzVZE%3Sv@&JGeD@hh$AcVB4GJJ5PkCzVCjRh_&r_bKx2U3u3+hFzytSf9tSHdsdpZ#mtxeWJ4b&UuTzB5WbTLW3bF%D&?HPFR9LZpwkzsDJp9ZNv26rJQh';

/**
 * @typedef {Object} AuthenticationCode
 * @property {string} salt - The salt used to create the public and private hash
 * @property {string} pubHash - The public Hash of the Code
 * @property {string} privHash - The private Hash of the Code
 */

/**
 * @typedef {Object} SED - Collection of data and signatures that may be utilized to confirm the integrity of the data.
 * @property {Signature} groupSignature - Signature created with the data and the group authentication code.
 * @property {Signature} stationSignature - Signature created with the data and the station authentication code.
 * @property {*} data - Data the signatures are based on.
 */

/**
 * @typedef {Object} Signature
 * @property {string} signature - Signature of the data generated with a specific authentication code.
 * @property {string} pubHash - Public hash of the authentication code this signature was created with.
 */

/**
 * Converts a word list to hexadecimal values.
 * @private
 * @param {CryptoJS.lib.WordArray} words - Word list to convert into hexadecimal values.
 */
function wordsToHex(words) {
    //noinspection JSUnresolvedVariable
    return CryptoJS.enc.Hex.stringify(words);
}

//
/**
 * Generate Hash-based message authentication code.
 * @private
 * @param {*} data - Arbitrary data to generate a HMAC for.
 * @param {string} password - The key to use when hashing the data.
 */
function generateHMAC(data, password) {
    //noinspection JSUnresolvedFunction
    return wordsToHex(CryptoJS.HmacSHA512(data, password));
}

/**
 * Sign the data with a passed authentication code.
 * @private
 * @param {*} data - Arbitrary data to sign.
 * @param {AuthenticationCode} ac - Authentication to use when generating the signature.
 * @returns {Signature} An Signature instance that contains the generated signature as well as the public hash of the authentication code used for the signature.
 */
function generateSignature(data, ac) {
    return {
        signature: generateHMAC(data, ac.privHash),
        pubHash: ac.pubHash
    };
}

/**
 * Checks the signature of a SED package.
 * @private
 * @param {SED} SED - The signed and encrypted data.
 * @param {*} data - The decrypted data.
 * @param {AuthenticationCode} groupAC - The GroupAC used for checking.
 * @param {AuthenticationCode} stationAC - The GroupAC used for checking.
 * @returns {boolean}
 */
function checkSignature(SED, data, groupAC, stationAC) {
    return (groupAC.pubHash == SED.groupSignature.pubHash && generateHMAC(data, groupAC.privHash) == SED.groupSignature.signature) &&
        ( typeof stationAC === 'object' ? (stationAC.pubHash == SED.stationSignature.pubHash && generateHMAC(data, stationAC.privHash) == SED.stationSignature.signature) : true);
}

/**
 * Decrypt the signed data and check the signatures.
 * @private
 * @param {SED} SED - Encrypted and signed data to decrypt.
 * @param {AuthenticationCode} groupAC - Authentication code of the group used for encryption.
 * @returns {boolean|Object}    Either the decrypted data in case the encryption was successful or false if the signature verification failed.
 */
function decrypt(SED, groupAC) {
    //noinspection JSUnresolvedVariable
    const bytes = CryptoJS.Rabbit.decrypt(SED.data, groupAC.privHash);
    //noinspection JSUnresolvedVariable
    let data;
    try {
        //noinspection JSUnresolvedVariable
        data = JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
    } catch (err) {
        data = false;
    }
    return data;
}

/**
 * Object containing various cryptography related tasks like encryption, decryption and signature verification.
 * @public
 * @namespace
 * @type {{generateAC: Crypto.generateAC, encrypt: Crypto.encrypt, tryDecrypt: Crypto.tryDecrypt}}
 */
export let Crypto = {
    /**
     * Generate a private hash based on password and salt
     * @param password {string} - Phrase to use for encryption
     * @param salt {string} - Salt to add to the mix
     * @returns {string}
     */
    generatePubHash: function (password, salt) {
        if (typeof salt === 'string') { //noinspection JSUnresolvedVariable
            salt = CryptoJS.enc.Hex.parse(salt);
        }
        //noinspection JSUnresolvedFunction
        return wordsToHex(CryptoJS.PBKDF2(password + TYPE1_PEPPER, salt, {keySize: 512 / 32, iterations: 10}));
    },

    /**
     * Generate a private hash based on password and salt
     * @param password {string} - Phrase to use for encryption
     * @param salt {string} - Salt to add to the mix
     * @returns {string}
     */
    generatePrivHash: function (password, salt) {
        if (typeof salt === 'string') { //noinspection JSUnresolvedVariable
            salt = CryptoJS.enc.Hex.parse(salt);
        }
        //noinspection JSUnresolvedFunction
        return wordsToHex(CryptoJS.PBKDF2(password + TYPE2_PEPPER, salt, {keySize: 512 / 32, iterations: 1000}));
    },


    /**
     * Generates an authentication code for.
     * @public
     * @param password  {string}     Password to generate the authentication code from.
     * @param salt      {string=}    Salt to recreate a specific authentication code.
     * @returns {AuthenticationCode}   The resulting authentication code object.
     */
    generateAC: function (password, salt = CryptoJS.lib.WordArray.random(128 / 8)) {
        if (typeof salt === 'string') { //noinspection JSUnresolvedVariable
            salt = CryptoJS.enc.Hex.parse(salt);
        }
        //noinspection JSUnresolvedFunction
        return {
            salt: wordsToHex(salt),
            pubHash: Crypto.generatePubHash(password, salt),
            privHash: Crypto.generatePrivHash(password, salt)
        };
    },

    /**
     * Encrypt data and sign it.
     * @public
     * @param data {*} Data to encrypt.
     * @param {AuthenticationCode} groupAC - Group authentication code used for encryption.
     * @param {AuthenticationCode} stationAC - Station authentication code used for encryption.
     * @returns {{groupSignature: Signature, stationSignature: Signature, data: (string|*)}}
     */
    encrypt: function (data, groupAC, stationAC) {
        //noinspection JSUnresolvedVariable
        return {
            groupSignature: generateSignature(data, groupAC),
            stationSignature: generateSignature(data, stationAC),
            data: CryptoJS.Rabbit.encrypt(JSON.stringify(data), groupAC.privHash).toString()
        };
    },

    /**
     * Attempts to decrypt a given SED (signed and encrypted data) with the given ACs.
     * @public
     * @param {Log} log - A log object.
     * @param {SED} SED - Encrypted and signed data to decrypt.
     * @param {AuthenticationCode[]} acs - Array of authentication codes to attempt decryption with.
     * @returns {Object|boolean} Object containing the data and the signatureEnforced property (whether or not the data has been checked against the station's AC) or false in case something went wrong or decryption/signature checking isn't possible or unsuccessful.
     */
    tryDecrypt: function (log, SED, acs) {

        const loggerPresent = (typeof log === 'object' && typeof log.warning === 'function');
        if (!SED || !log || !loggerPresent || !(typeof SED === 'object' && SED.hasOwnProperty('groupSignature') && SED.hasOwnProperty('stationSignature') && SED.hasOwnProperty('data'))
        ) {
            if (loggerPresent) log.error('Wrong parameters passed! (consult documentation)');
            else throw new Error('Wrong parameters passed! (consult documentation)');
            return false;
        }

        lodash.remove(acs, _.isUndefined);

        const usedACs = {};

        const groupAC = _.find(acs, function (ac, i) {
            const match = SED.groupSignature.pubHash == ac.pubHash;
            if (match) usedACs.groupAC = i;
            return match;
        });
        if (!groupAC) {
            log.error('GROUP AC NOT PROVIDED - FATAL - RETURNING');
            return false;
        }

        const stationAC = _.find(acs, function (ac, i) {
            const match = SED.stationSignature.pubHash == ac.pubHash;
            if (match) usedACs.stationAC = i;
            return match;
        });
        if (!stationAC) log.warning('STATION AC NOT PROVIDED! SKIPPING VALIDITY CHECK');

        const data = decrypt(SED, groupAC);
        if (data && checkSignature(SED, data, groupAC, stationAC))
            return {
                data: data,
                signatureEnforced: stationAC !== undefined,
                usedACs: usedACs
            };
        return false;
    }
};