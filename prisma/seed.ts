import { PrismaClient, ShiftRole } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const studio = await prisma.studio.upsert({
    where: { slug: "movie-unit" },
    update: { title: "Movie Unit", description: "Демо-студия для Movie Shooting Schedule" },
    create: { slug: "movie-unit", title: "Movie Unit", description: "Демо-студия для Movie Shooting Schedule" }
  });

  await prisma.assignment.deleteMany({ where: { studioId: studio.id } });
  await prisma.shift.deleteMany({ where: { studioId: studio.id } });
  await prisma.projectPerson.deleteMany({ where: { studioId: studio.id } });
  await prisma.project.deleteMany({ where: { studioId: studio.id } });
  await prisma.vehicle.deleteMany({ where: { studioId: studio.id } });
  await prisma.studioMember.deleteMany({ where: { studioId: studio.id } });

  const users = await Promise.all(
    [
      ["owner-seed", "owner@example.com", "Егор Смирнов"],
      ["focus-seed", "focus@example.com", "Илья Фокус"],
      ["playback-seed", "playback@example.com", "Маша Плейбек"],
      ["assistant-seed", "assistant@example.com", "Антон Ассистент"],
      ["gaffer-seed", "gaffer@example.com", "Денис Гаффер"],
      ["pending-seed", "pending@example.com", "Новый Пользователь"]
    ].map(([yandexId, email, displayName]) =>
      prisma.user.upsert({
        where: { yandexId },
        update: { email, displayName },
        create: { yandexId, email, displayName }
      })
    )
  );

  await Promise.all(
    users.map((user, index) =>
      prisma.studioMember.create({
        data: {
          studioId: studio.id,
          userId: user.id,
          status: index === users.length - 1 ? "PENDING" : "APPROVED",
          accessLevel: index === 0 ? "OWNER" : index === 4 ? "ADMIN" : "USER",
          displayName: user.displayName
        }
      })
    )
  );

  const projectTitles = [
    "Туманова / Гениус Киселёв",
    "Дом с Ментами",
    "АБР",
    "Бункер",
    "Спицын / Метелица",
    "Фазик / Литвинов",
    "Берсеева / Косицкий"
  ];
  const projects = await Promise.all(
    projectTitles.map((title, index) =>
      prisma.project.create({
        data: {
          studioId: studio.id,
          title,
          shortTitle: title.split(" / ")[0],
          emoji: ["🎬", "🏠", "🚨", "🕳️", "❄️", "📼", "🎞️"][index]
        }
      })
    )
  );

  const vehicles = await Promise.all(
    [
      ["Белый Crafter", "Х578ОУ 98", "🚐"],
      ["Оранжевый Sprinter", "Е375МЕ 198", "🟠"],
      ["Зелёный Sprinter", "О016КХ 76", "🟢"],
      ["Белый Sprinter", "У079КХ 76", "⚪"]
    ].map(([title, plate, emoji]) =>
      prisma.vehicle.create({
        data: { studioId: studio.id, title, plate, emoji }
      })
    )
  );

  await prisma.projectPerson.createMany({
    data: [
      { studioId: studio.id, projectId: projects[0].id, role: "DP", name: "Алексей Киселёв" },
      { studioId: studio.id, projectId: projects[0].id, role: "DIRECTOR", name: "Анна Туманова" },
      { studioId: studio.id, projectId: projects[1].id, role: "SECOND_AD", name: "Светлана Ким" },
      { studioId: studio.id, projectId: projects[2].id, role: "SECOND_CAMERA_OPERATOR", userId: users[1].id }
    ]
  });

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  for (let i = 0; i < 8; i += 1) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    const shift = await prisma.shift.create({
      data: {
        studioId: studio.id,
        date,
        projectId: projects[i % projects.length].id,
        dayType: i % 3 === 0 ? "Павильон" : i % 4 === 0 ? "Смена (+ погрузка)" : "Смена",
        vehicleId: vehicles[i % vehicles.length].id,
        note: i % 2 === 0 ? "Уточнить точку сбора вечером накануне." : null
      }
    });
    const roles: ShiftRole[] = ["FOCUS_PULLER", "PLAYBACK", "ASSISTANT", "GAFFER"];
    await Promise.all(
      roles.map((role, index) =>
        prisma.assignment.create({
          data: {
            studioId: studio.id,
            shiftId: shift.id,
            userId: users[index + 1].id,
            role
          }
        })
      )
    );
  }

  console.log("Seed data created for studio Movie Unit.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
