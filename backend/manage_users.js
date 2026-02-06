#!/usr/bin/env node

/**
 * Script de Gerenciamento de Usuários - Oracullo
 * 
 * Uso:
 *   node manage_users.js list                              - Listar todos os usuários
 *   node manage_users.js create <nome> <email> <senha>     - Criar novo usuário
 *   node manage_users.js password <email> <nova_senha>     - Alterar senha
 *   node manage_users.js admin <email>                     - Tornar usuário admin
 */

import pg from 'pg';
import bcrypt from 'bcrypt';

const { Pool } = pg;

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'oracullo',
  user: process.env.DB_USER || 'oracullo_user',
  password: process.env.DB_PASSWORD || 'oracullo123'
});

async function listUsers() {
  const result = await pool.query(
    'SELECT id, nome, email, role, ativo, created_at FROM usuarios ORDER BY id'
  );
  
  console.log('\n📋 Usuários cadastrados:\n');
  console.log('ID | Nome                | Email                    | Role  | Ativo | Criado em');
  console.log('---|---------------------|--------------------------|-------|-------|-------------------');
  
  result.rows.forEach(user => {
    const id = String(user.id).padEnd(2);
    const nome = user.nome.padEnd(19).substring(0, 19);
    const email = user.email.padEnd(24).substring(0, 24);
    const role = user.role.padEnd(5);
    const ativo = user.ativo ? '✓' : '✗';
    const created = new Date(user.created_at).toLocaleDateString('pt-BR');
    
    console.log(`${id} | ${nome} | ${email} | ${role} | ${ativo}     | ${created}`);
  });
  
  console.log(`\nTotal: ${result.rows.length} usuário(s)\n`);
}

async function createUser(nome, email, senha) {
  // Verificar se email já existe
  const existing = await pool.query('SELECT id FROM usuarios WHERE email = $1', [email]);
  
  if (existing.rows.length > 0) {
    console.error(`❌ Erro: Email ${email} já está cadastrado!`);
    process.exit(1);
  }
  
  // Hash da senha
  const senhaHash = await bcrypt.hash(senha, 10);
  
  // Criar usuário
  const result = await pool.query(
    'INSERT INTO usuarios (nome, email, senha_hash, role) VALUES ($1, $2, $3, $4) RETURNING id, nome, email, role',
    [nome, email, senhaHash, 'user']
  );
  
  const user = result.rows[0];
  console.log('\n✅ Usuário criado com sucesso!');
  console.log(`   ID: ${user.id}`);
  console.log(`   Nome: ${user.nome}`);
  console.log(`   Email: ${user.email}`);
  console.log(`   Role: ${user.role}`);
  console.log(`   Senha: ${senha}\n`);
}

async function changePassword(email, novaSenha) {
  // Verificar se usuário existe
  const existing = await pool.query('SELECT id, nome FROM usuarios WHERE email = $1', [email]);
  
  if (existing.rows.length === 0) {
    console.error(`❌ Erro: Usuário com email ${email} não encontrado!`);
    process.exit(1);
  }
  
  const user = existing.rows[0];
  
  // Hash da nova senha
  const senhaHash = await bcrypt.hash(novaSenha, 10);
  
  // Atualizar senha
  await pool.query(
    'UPDATE usuarios SET senha_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE email = $2',
    [senhaHash, email]
  );
  
  console.log('\n✅ Senha alterada com sucesso!');
  console.log(`   Usuário: ${user.nome}`);
  console.log(`   Email: ${email}`);
  console.log(`   Nova senha: ${novaSenha}\n`);
}

async function makeAdmin(email) {
  // Verificar se usuário existe
  const existing = await pool.query('SELECT id, nome, role FROM usuarios WHERE email = $1', [email]);
  
  if (existing.rows.length === 0) {
    console.error(`❌ Erro: Usuário com email ${email} não encontrado!`);
    process.exit(1);
  }
  
  const user = existing.rows[0];
  
  if (user.role === 'admin') {
    console.log(`ℹ️  Usuário ${user.nome} já é admin!`);
    return;
  }
  
  // Tornar admin
  await pool.query(
    'UPDATE usuarios SET role = $1, updated_at = CURRENT_TIMESTAMP WHERE email = $2',
    ['admin', email]
  );
  
  console.log('\n✅ Usuário promovido a admin!');
  console.log(`   Usuário: ${user.nome}`);
  console.log(`   Email: ${email}`);
  console.log(`   Role: admin\n`);
}

async function main() {
  const command = process.argv[2];
  
  try {
    switch (command) {
      case 'list':
        await listUsers();
        break;
        
      case 'create':
        const nome = process.argv[3];
        const email = process.argv[4];
        const senha = process.argv[5];
        
        if (!nome || !email || !senha) {
          console.error('❌ Uso: node manage_users.js create <nome> <email> <senha>');
          process.exit(1);
        }
        
        await createUser(nome, email, senha);
        break;
        
      case 'password':
        const emailPwd = process.argv[3];
        const novaSenha = process.argv[4];
        
        if (!emailPwd || !novaSenha) {
          console.error('❌ Uso: node manage_users.js password <email> <nova_senha>');
          process.exit(1);
        }
        
        await changePassword(emailPwd, novaSenha);
        break;
        
      case 'admin':
        const emailAdmin = process.argv[3];
        
        if (!emailAdmin) {
          console.error('❌ Uso: node manage_users.js admin <email>');
          process.exit(1);
        }
        
        await makeAdmin(emailAdmin);
        break;
        
      default:
        console.log('📖 Comandos disponíveis:\n');
        console.log('  node manage_users.js list                              - Listar todos os usuários');
        console.log('  node manage_users.js create <nome> <email> <senha>     - Criar novo usuário');
        console.log('  node manage_users.js password <email> <nova_senha>     - Alterar senha');
        console.log('  node manage_users.js admin <email>                     - Tornar usuário admin\n');
        process.exit(1);
    }
    
    await pool.end();
  } catch (error) {
    console.error('❌ Erro:', error.message);
    await pool.end();
    process.exit(1);
  }
}

main();
