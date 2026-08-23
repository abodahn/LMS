/**
 * Creates (or resets) a Super Admin account.
 *
 *   npx tsx scripts/create-admin.mts
 *   npx tsx scripts/create-admin.mts --code LMS --password 1234
 *   npx tsx scripts/create-admin.mts --code ops --password "a long passphrase" --name "Ops Team"
 *
 * Why a script and not a seed entry: a privileged account with a known password
 * must be something an operator deliberately runs on the box they intend it to
 * exist on. Baking it into the seed would put it on every deployment including
 * production, which is exactly the "no hardcoded users in production" rule this
 * platform is documented against.
 *
 * On "bypassing everything": this grants the SUPER_ADMIN role, which already
 * holds every permission in the system, so the account can reach every screen
 * and every action. It deliberately does *not* add a code path that skips
 * permission checks. A real bypass would be a second, untested route through
 * the app that no audit entry describes — less access than this, and far more
 * risk. Everything this account does is logged against its name, which is what
 * makes it safe to hand out.
 */
import "dotenv/config";
import { prisma } from "../prisma/seed/client";
import bcrypt from "bcryptjs";

const arg = (name: string, fallback: string) => {
  const i = process.argv.indexOf(`--${name}`);
  return i !== -1 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
};

const code = arg("code", "LMS");
const password = arg("password", "1234");
const fullName = arg("name", "LMS Administrator");
const email = arg("email", `${code.toLowerCase()}@tcgarments.com`);

async function main() {
  const role = await prisma.role.findUnique({ where: { key: "SUPER_ADMIN" } });
  if (!role) throw new Error("SUPER_ADMIN role not found — run `npm run db:seed` first.");

  // 12 rounds, same as every other account: the password is weak, the storage
  // of it should not be.
  const passwordHash = await bcrypt.hash(password, 12);

  const data = {
    email: email.toLowerCase(),
    username: code.toLowerCase(),
    passwordHash,
    fullName,
    status: "ACTIVE",
    // Deliberately false: the point of this account is to sign straight in.
    mustChangePassword: false,
    failedLoginCount: 0,
    lockedUntil: null,
    deletedAt: null,
  };

  const user = await prisma.user.upsert({
    where: { employeeCode: code },
    update: data,
    create: { employeeCode: code, ...data },
  });

  await prisma.userRole.deleteMany({ where: { userId: user.id } });
  await prisma.userRole.create({ data: { userId: user.id, roleId: role.id } });

  // Any existing session keeps the old password alive until it expires.
  const killed = await prisma.session.deleteMany({ where: { userId: user.id } });

  // The creation of a privileged account is itself worth a record.
  await prisma.auditLog.create({
    data: {
      actorName: "scripts/create-admin",
      action: "SUPER_ADMIN_PROVISIONED",
      entity: "User",
      entityId: user.id,
      summary: `Super Admin "${code}" created or reset from the command line`,
    },
  });

  const weak = password.length < 10;
  console.log(`\n  Super Admin ready`);
  console.log(`    Sign in with   ${code}   (or ${email}, or ${code.toLowerCase()})`);
  console.log(`    Password       ${password}`);
  console.log(`    Role           SUPER_ADMIN — every permission in the system`);
  if (killed.count) console.log(`    Sessions       ${killed.count} existing session(s) revoked`);

  if (weak) {
    console.log(`\n  ⚠  That password is short enough to be guessed in seconds.`);
    console.log(`     Fine for a local or demo instance. Before this database holds real`);
    console.log(`     employee records, re-run with a real one:`);
    console.log(`       npx tsx scripts/create-admin.mts --code ${code} --password "<something long>"\n`);
  } else {
    console.log("");
  }
}

main()
  .catch((e) => {
    console.error(e instanceof Error ? e.message : e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
