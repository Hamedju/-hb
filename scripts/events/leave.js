const { getTime, drive } = global.utils;

module.exports = {
	config: {
		name: "leave",
		version: "1.4",
		author: "NTKhang",
		category: "events"
	},

	langs: {
		vi: {
			session1: "sáng",
			session2: "trưa",
			session3: "chiều",
			session4: "tối",
			leaveType1: "tự rời",
			leaveType2: "bị kick",
			defaultLeaveMessage: "{userName} đã {type} khỏi nhóm"
		},
		en: {
			session1: "morning",
			session2: "noon",
			session3: "afternoon",
			session4: "evening",
			leaveType1: "𝐭𝐮 𝐜𝐫𝐨𝐢𝐬 𝐪𝐮𝐞 𝐜'𝐞𝐬𝐭 𝐜𝐡𝐞𝐳 𝐭𝐨𝐢, 𝐠𝐞𝐧𝐫𝐞 𝐭𝐮 𝐞𝐧𝐭𝐫𝐞 𝐞𝐭 𝐭𝐮 𝐬𝐨𝐫𝐭 𝐪𝐮𝐚𝐧𝐝 𝐭𝐮 𝐯𝐞𝐮𝐱....😕🖕",
			leaveType2: "𝐞́𝐭𝐞́ 𝐞𝐱𝐩𝐮𝐥𝐬𝐞́ 𝐝𝐮 𝐠𝐫𝐨𝐮𝐩𝐞,𝐩𝐚𝐫𝐜𝐞 𝐪𝐮'𝐢𝐥 𝐚̀ 𝐞́𝐭𝐞́ 𝐢𝐦𝐩𝐨𝐥𝐢𝐞 𝐚𝐯𝐞𝐜 𝐥𝐞 𝐁𝐨𝐬𝐬 𝐝𝐮 𝐠𝐫𝐨𝐮𝐩𝐞 🤧",
			defaultLeaveMessage: "{userName} {type}"
		}
	},

	onStart: async ({ threadsData, message, event, api, usersData, getLang }) => {
		if (event.logMessageType == "log:unsubscribe")
			return async function () {
				const { threadID } = event;
				const threadData = await threadsData.get(threadID);
				if (!threadData.settings.sendLeaveMessage)
					return;
				const { leftParticipantFbId } = event.logMessageData;
				if (leftParticipantFbId == api.getCurrentUserID())
					return;
				const hours = getTime("HH");

				const threadName = threadData.threadName;
				const userName = await usersData.getName(leftParticipantFbId);

				// {userName}   : name of the user who left the group
				// {type}       : type of the message (leave)
				// {boxName}    : name of the box
				// {threadName} : name of the box
				// {time}       : time
				// {session}    : session

				let { leaveMessage = getLang("defaultLeaveMessage") } = threadData.data;
				const form = {
					mentions: leaveMessage.match(/\{userNameTag\}/g) ? [{
						tag: userName,
						id: leftParticipantFbId
					}] : null
				};

				leaveMessage = leaveMessage
					.replace(/\{userName\}|\{userNameTag\}/g, userName)
					.replace(/\{type\}/g, leftParticipantFbId == event.author ? getLang("leaveType1") : getLang("leaveType2"))
					.replace(/\{threadName\}|\{boxName\}/g, threadName)
					.replace(/\{time\}/g, hours)
					.replace(/\{session\}/g, hours <= 10 ?
						getLang("session1") :
						hours <= 12 ?
							getLang("session2") :
							hours <= 18 ?
								getLang("session3") :
								getLang("session4")
					);

				form.body = leaveMessage;

				if (leaveMessage.includes("{userNameTag}")) {
					form.mentions = [{
						id: leftParticipantFbId,
						tag: userName
					}];
				}

				if (threadData.data.leaveAttachment) {
					const files = threadData.data.leaveAttachment;
					const attachments = files.reduce((acc, file) => {
						acc.push(drive.getFile(file, "stream"));
						return acc;
					}, []);
					form.attachment = (await Promise.allSettled(attachments))
						.filter(({ status }) => status == "fulfilled")
						.map(({ value }) => value);
				}
				message.send(form);
			};
	}
};

				
