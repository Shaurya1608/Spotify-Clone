console.log("welcome to spotify")
// initialize the variable
let songIndex = 0;
let audioElement = new Audio('songs/1.mp3');
let masterPlay = document.getElementById('masterPlay');
let MyProgressBar=document.getElementById('MyProgressBar');
let gif = document.getElementById('gif');
let MasterSongName = document.getElementById('MasterSongName')
let songItems = Array.from(document.getElementsByClassName('songItem'))

let songs=[
    {songName:"let me love", filepath:"songs/1.mp3", coverpath:"covers/1.jpg"},
    {songName:"phonk", filepath:"songs/2.mp3", coverpath:"covers/2.jpg"},
    {songName:"GymRats", filepath:"songs/3.mp3", coverpath:"covers/3.jpg"},
    {songName:"Beliver-Drafons", filepath:"songs/4.mp3", coverpath:"covers/4.jpg"},
    {songName:"Industry Baby", filepath:"songs/5.mp3", coverpath:"covers/5.jpg"},
    {songName:"Despacito", filepath:"songs/6.mp3", coverpath:"covers/6.jpg"},
    {songName:"They Call It Love - mathew", filepath:"songs/7.mp3", coverpath:"covers/7.jpg"},
    {songName:"Baby - Justin Biber", filepath:"songs/9.mp3", coverpath:"covers/8.jpg"},
    {songName:"APT - Black Pink", filepath:"songs/8.mp3", coverpath:"covers/9.jpg"},
]

songItems.forEach((element ,i)=> {
    element.getElementsByTagName("img")[0].src=songs[i].coverpath;
    element.getElementsByClassName("songName")[0].innerText=songs[i].songName;
});





// audioElement.play();


// handle play and pause
masterPlay.addEventListener('click',function(){
    if(audioElement.paused || audioElement.currentTime<=0){
        audioElement.play().catch((error) => {
            console.error('Error playing audio:', error);
            // Keep play icon if error occurs
            masterPlay.classList.remove('ri-pause-circle-line');
            masterPlay.classList.add('ri-play-circle-line');
            gif.style.opacity=0;
        });
        masterPlay.classList.remove('ri-play-circle-line')
        masterPlay.classList.add('ri-pause-circle-line')
        gif.style.opacity=1;
    }
    else{
         audioElement.pause();
        masterPlay.classList.remove('ri-pause-circle-line')
        masterPlay.classList.add('ri-play-circle-line')
         gif.style.opacity=0;

    }
})

audioElement.addEventListener('timeupdate',function(){
    // updaate seekbar
    progress = parseInt((audioElement.currentTime/audioElement.duration)* 100);
    MyProgressBar.value=progress;
});

MyProgressBar.addEventListener('change',function(){
    audioElement.currentTime=MyProgressBar.value * audioElement.duration/100
})

const makeAllplays = ()=>{
     Array.from(document.getElementsByClassName('songItemPlay')).forEach((element)=>{
         element.classList.remove('ri-pause-circle-line');
         element.classList.add('ri-play-circle-line');
     })
}

const updateSongItemIcon = (index, isPlaying) => {
    const songButton = document.getElementById(index.toString());
    if(songButton) {
        if(isPlaying) {
            songButton.classList.remove('ri-play-circle-line');
            songButton.classList.add('ri-pause-circle-line');
        } else {
            songButton.classList.remove('ri-pause-circle-line');
            songButton.classList.add('ri-play-circle-line');
        }
    }
}



Array.from(document.getElementsByClassName('songItemPlay')).forEach((element)=>{
    element.addEventListener('click', (e)=>{
        const clickedSongIndex = parseInt(e.target.id);
        
        // If clicking the same song that's currently playing
        if(songIndex === clickedSongIndex && !audioElement.paused) {
            // Pause the song
            audioElement.pause();
            e.target.classList.remove('ri-pause-circle-line');
            e.target.classList.add('ri-play-circle-line');
            masterPlay.classList.remove('ri-pause-circle-line');
            masterPlay.classList.add('ri-play-circle-line');
            gif.style.opacity=0;
        } else {
            // Play the song (either new song or resuming paused song)
            makeAllplays();
            songIndex = clickedSongIndex;
            e.target.classList.remove('ri-play-circle-line');
            e.target.classList.add('ri-pause-circle-line');
            MasterSongName.innerText= songs[songIndex].songName;
            
            // Only change source if it's a different song
            if(audioElement.src !== `${window.location.origin}/songs/${songIndex+1}.mp3`) {
                audioElement.src=`songs/${songIndex+1}.mp3`;
                audioElement.currentTime=0;
            }
            
            audioElement.play().catch((error) => {
                console.error('Error playing audio:', error);
                // Reset play button on error
                makeAllplays();
                masterPlay.classList.remove('ri-pause-circle-line');
                masterPlay.classList.add('ri-play-circle-line');
                gif.style.opacity=0;
            });
            masterPlay.classList.remove('ri-play-circle-line')
            masterPlay.classList.add('ri-pause-circle-line')
            gif.style.opacity=1;
        }
    })
})

document.getElementById('next').addEventListener('click',function(){
    if(songIndex>=8){
        songIndex=0
    }
    else{
        songIndex+=1;
    }
     makeAllplays();
     audioElement.src=`songs/${songIndex+1}.mp3`
     MasterSongName.innerText= songs[songIndex].songName;
        audioElement.currentTime=0;
        audioElement.play().catch((error) => {
            console.error('Error playing audio:', error);
            masterPlay.classList.remove('ri-pause-circle-line');
            masterPlay.classList.add('ri-play-circle-line');
            gif.style.opacity=0;
            return;
        });
          masterPlay.classList.remove('ri-play-circle-line')
        masterPlay.classList.add('ri-pause-circle-line')
        updateSongItemIcon(songIndex, true);
        gif.style.opacity=1;
})
document.getElementById('previous').addEventListener('click',function(){
    if(songIndex<=0){
        songIndex=8;
    }
    else{
        songIndex-=1;
    }
     makeAllplays();
     audioElement.src=`songs/${songIndex+1}.mp3`
     MasterSongName.innerText= songs[songIndex].songName;
        audioElement.currentTime=0;
        audioElement.play().catch((error) => {
            console.error('Error playing audio:', error);
            masterPlay.classList.remove('ri-pause-circle-line');
            masterPlay.classList.add('ri-play-circle-line');
            gif.style.opacity=0;
            return;
        });
          masterPlay.classList.remove('ri-play-circle-line')
        masterPlay.classList.add('ri-pause-circle-line')
        updateSongItemIcon(songIndex, true);
        gif.style.opacity=1;
})