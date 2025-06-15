let followersFile = null;
let followingFile = null;

const folderInput = document.getElementById('folderInput');
const statusSpan = document.getElementById('status');
const resultCount = document.getElementById('resultCount');
const resultList = document.getElementById('resultList');
const note = document.getElementById("note");

folderInput.addEventListener('change', handleFolderUpload);

function handleFolderUpload(event) {
  const files = event.target.files;

  followersFile = null;
  followingFile = null;

  for (const file of files) {
    if (file.webkitRelativePath.includes('followers_1.json')) {
      followersFile = file;
    } else if (file.webkitRelativePath.includes('following.json')) {
      followingFile = file;
    }
  }

  if (followersFile && followingFile) {
    statusSpan.textContent = "파일 업로드 성공 ✅";
    processData();
  } else {
    statusSpan.textContent = "필요한 파일이 없습니다 ❌";
    statusSpan.style.color = "red";
  }
}

function processData() {
  
  if (!followersFile || !followingFile) {
    alert('먼저 폴더를 업로드해주세요.');
    return;
  }
  
  Promise.all([
    followersFile.text().then(JSON.parse),
    followingFile.text().then(JSON.parse)
  ]).then(([followersJson, followingJson]) => {
    const followers = followersJson.map(f => f.string_list_data[0].value);
    const following = followingJson.relationships_following.map(f => f.string_list_data[0]);

    // 맞팔 안 된 계정 + timestamp 포함
    let notFollowedBack = following.filter(f => !followers.includes(f.value));

    // 오래된 순으로 정렬 (timestamp는 내가 팔로우한 시간)
    notFollowedBack.sort((a, b) => a.timestamp - b.timestamp);

    resultList.innerHTML = '';

    if (notFollowedBack.length === 0) {
      note.innerHTML = "";
      resultList.innerHTML = "<li>모든 계정이 맞팔 상태입니다!</li>";
    } else {
      note.innerHTML = "<p>괄호 안의 날짜는 내가 팔로우한 날짜입니다.</p>";
      notFollowedBack.forEach(account => {
        const li = document.createElement('li');

        // 날짜 표시 (UTC timestamp -> YYYY-MM-DD)
        const date = new Date(account.timestamp * 1000);
        const dateStr = date.toISOString().split('T')[0];

        const link = document.createElement('a');
        link.href = account.href;
        link.textContent = account.value;
        link.target = '_blank';

        link.addEventListener('click', () => {
          li.style.textDecoration = 'line-through';
          li.style.opacity = 0.5;
        });

        li.appendChild(link);
        li.append(` (${dateStr})`); // 날짜 붙이기

        resultList.appendChild(li);
      });
    }

    resultCount.textContent = `(${notFollowedBack.length}명)`;
  }).catch(err => {
    console.error(err);
    alert("JSON 파싱에 실패했습니다. 파일이 올바른지 확인해주세요.");
  });
}
