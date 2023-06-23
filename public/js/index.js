const socket = io("localhost:3000");


let isAlreadyCalling = false;
let getCalled = false;




const { RTCPeerConnection, RTCSessionDescription } = window;

const peerConnection = new RTCPeerConnection();

async function callUser(socketId) {
    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(new RTCSessionDescription(offer));

    socket.emit("call-user", {
        offer,
        to: socketId,
    });
}

 function unselecteed(){
    const alredyselected=document.querySelectorAll(".active-user .active-user--selected");

    alredyselected.forEach(e=>{
        e.setAttribute("class","active-user");
    })
 }

 function createuser(socketId){
    const userContainer = document.createElement("div");

    const username = document.createElement("p");

    userContainer.setAttribute("class", "active-user");
    userContainer.setAttribute("id", socketId);
    username.setAttribute("class", "username");
    username.innerHTML = `user : ${socketId}`;

    userContainer.appendChild(username);

    userContainer.addEventListener("click", () => {
        unselecteed();
        userContainer.setAttribute(
            "class",
            "active-user active-user--selected"
        );
        const talkingWithInfo =
            document.getElementById("talking-with-info");
        talkingWithInfo.innerHTML = `call by user : ${socketId}`;
        callUser(socketId);
    });
     return userContainer;
 }

 function updateuserList(users){
    const activeUserContainer = document.getElementById(
        "active-user-container"
    );
        
    users.forEach((socketId) => {
        const userExist = document.getElementById(socketId);

        if (!userExist) {
           const userContainer=createuser(socketId);
            activeUserContainer.appendChild(userContainer);
        }
    });
 }
socket.on("update-user-list", ({ users }) => {
 updateuserList(users);
});

socket.on("remove-user", ({ socketId }) => {
    const user = document.getElementById(socketId);

    if (user) {
        user.remove();
    }
});

socket.on("call-made", async (data) => {
    if (getCalled) {
        const confirmed = confirm(
            `user with by${data.socket} calling you .acsept? `
        );

        if (!confirmed) {
            socket.emit("reject-call", {
                from: data.socket,
            });

            return;
        }
    }

    await peerConnection.setRemoteDescription(
        new RTCSessionDescription(data.offer)
    );

    const answer = await peerConnection.createAnswer();

    await peerConnection.setLocalDescription(new RTCSessionDescription(answer));

    socket.emit("make-answer", {
        answer,
        to: data.socket,
    });

    getCalled = true;
});

socket.on("answer-made", async (data) => {
    await peerConnection.setRemoteDescription(
        new RTCSessionDescription(data.answer)
    );

    if (!isAlreadyCalling) {
        callUser(data.socket);
        isAlreadyCalling = true;
    }
});

socket.on("call-rejected", (data) => {
    alert(`call user with by id:${data.socket} `);
    unselecteed();
});

peerConnection.ontrack = function ({ streams: [stream] }) {
    const remoteVideo = document.getElementById("remote-video");

    if (remoteVideo) {
        remoteVideo.srcObject = stream;
    }
};

navigator.getUserMedia(
    { video: true, audio: true },
    (stream) => {
        const localVideo = document.getElementById("local-video");

        if (localVideo) {
            localVideo.srcObject = stream;
        }

        stream
            .getTracks()
            .forEach((track) => peerConnection.addTrack(track, stream));
    },
    (error) => {
        console.log(error.message);
    }
);
