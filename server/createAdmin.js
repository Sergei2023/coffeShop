const bcrypt = require('bcrypt');

const plainPassword = 'admin123';
const saltRounds = 10;

bcrypt.hash(plainPassword, saltRounds, function(err, hash) {
    if (err) {
        console.error('Ошибка при генерации хэша:', err);
        return;
    }
    console.log('Хэш пароля успешно сгенерирован!');
    console.log('=====================================');
    console.log('Ваш пароль: ', plainPassword);
    console.log('Его хэш:    ', hash);
    console.log('=====================================');
    console.log('\nСКОПИРУЙТЕ ЭТУ СТРОЧКУ (ХЭШ) ДАЛЕЕ:');
    console.log(hash);
});