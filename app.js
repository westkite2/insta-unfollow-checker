let followersFile = null;
let followingFile = null;

const zipInput = document.getElementById('zipInput');
const statusSpan = document.getElementById('status');
const resultCount = document.getElementById('resultCount');
const resultList = document.getElementById('resultList');
const note = document.getElementById("note");

zipInput.addEventListener('change', handleZipUpload);

async function handleZipUpload(event) {
  const file = event.target.files[0];
  if (!file) return;

  followersFile = null;
  followingFile = null;

  const jszip = new JSZip();
  const zip = await jszip.loadAsync(file);

  zip.forEach((relativePath, zipEntry) => {
    if (relativePath.includes('followers_1.json')) {
      followersFile = zipEntry;
    } else if (relativePath.includes('following.json')) {
      followingFile = zipEntry;
    }
  });

  if (followersFile && followingFile) {
    statusSpan.textContent = "ZIP 업로드 성공 ✅";
    processData();
  } else {
    statusSpan.textContent = "ZIP에서 followers_1.json 또는 following.json을 찾지 못했습니다 ❌";
    statusSpan.style.color = "red";
  }
}


async function processData() {
  if (!followersFile || !followingFile) {
    alert('먼저 ZIP파일을 업로드해주세요.');
    return;
  }
  try {
    const followersJson = JSON.parse(await followersFile.async("string"));
    const followingJson = JSON.parse(await followingFile.async("string"));

    const followers = followersJson.map(f => f.string_list_data[0].value);
    const following = followingJson.relationships_following.map(f => f.string_list_data[0]);

    let notFollowedBack = following.filter(f => !followers.includes(f.value));
    notFollowedBack.sort((a, b) => a.timestamp - b.timestamp);

    resultList.innerHTML = '';

    if (notFollowedBack.length === 0) {
      note.innerHTML = "";
      resultList.innerHTML = "<li>모든 계정이 맞팔 상태입니다!</li>";
    } else {
      note.innerHTML = "<p>괄호 안의 날짜는 내가 팔로우한 날짜입니다.</p>";
      notFollowedBack.forEach(account => {
        const li = document.createElement('li');

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
        li.append(` (${dateStr})`);

        resultList.appendChild(li);
      });
    }

    resultCount.textContent = `${notFollowedBack.length}명`;
  } catch (err) {
    console.error(err);
    alert("ZIP 내부 JSON 파싱 실패: 파일 구조를 확인하세요.");
  }
}