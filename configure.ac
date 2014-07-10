AC_PREREQ([2.53])
AC_INIT([ribosome], [0.1])

AC_PATH_PROG([RUBY], [ruby])
AS_IF([test x"$RUBY" = "x"],[
    AC_MSG_ERROR([Ribosome requires ruby to operate, please install it])
])
      
AM_INIT_AUTOMAKE([foreign])
AC_OUTPUT([Makefile])
